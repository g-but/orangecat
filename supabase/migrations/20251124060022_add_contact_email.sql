-- =====================================================================
-- Add contact_email to profiles table
-- =====================================================================
-- This migration adds a public contact email field that can be different
-- from the registration email. The registration email is private (for auth),
-- while contact_email is public (visible on profile).
-- =====================================================================

BEGIN;

-- Add contact_email column
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- Add comment
COMMENT ON COLUMN public.profiles.contact_email IS 
  'Public contact email (different from registration email). Visible on profile for supporters to contact the user.';

-- Add index for searchability (optional, but useful)
CREATE INDEX IF NOT EXISTS idx_profiles_contact_email 
  ON public.profiles(contact_email) 
  WHERE contact_email IS NOT NULL;

COMMIT;







