-- Fix migration conflict and ensure contact_email column exists
-- This migration addresses the duplicate key error and adds the contact_email column

BEGIN;

-- Add contact_email column if it doesn't exist (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'contact_email'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN contact_email TEXT;
    COMMENT ON COLUMN public.profiles.contact_email IS 
      'Public contact email (different from registration email). Visible on profile for supporters to contact the user.';
    CREATE INDEX IF NOT EXISTS idx_profiles_contact_email 
      ON public.profiles(contact_email) 
      WHERE contact_email IS NOT NULL;
    RAISE NOTICE 'contact_email column added successfully';
  ELSE
    RAISE NOTICE 'contact_email column already exists';
  END IF;
END $$;

COMMIT;
