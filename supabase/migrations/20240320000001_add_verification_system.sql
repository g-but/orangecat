-- Add verification system fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS verification_level integer DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS verification_badge text CHECK (verification_badge IN ('official', 'verified', 'creator', 'celebrity')),
ADD COLUMN IF NOT EXISTS verified_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS verifier_user_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS lightning_address text;

-- Update existing columns if they don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS display_name text,
ADD COLUMN IF NOT EXISTS bitcoin_address text;

-- Add indexes for verification queries
CREATE INDEX IF NOT EXISTS profiles_verification_level_idx ON public.profiles(verification_level);
CREATE INDEX IF NOT EXISTS profiles_verification_badge_idx ON public.profiles(verification_badge);
CREATE INDEX IF NOT EXISTS profiles_verified_at_idx ON public.profiles(verified_at);

-- Add RLS policies for verification fields
-- Users can view verification status of all profiles
CREATE POLICY "Users can view verification status" ON public.profiles
  FOR SELECT USING (true);

-- Users can only update their own verification level if it's basic verification
CREATE POLICY "Users can update own basic verification" ON public.profiles
  FOR UPDATE USING (auth.uid() = id AND verification_level <= 1)
  WITH CHECK (auth.uid() = id AND verification_level <= 1);

-- Only verified admins can grant higher verification levels
-- (This would be implemented through a secure RPC function)

-- Create a function to safely update verification status (admin only)
CREATE OR REPLACE FUNCTION admin_update_verification(
  target_user_id uuid,
  new_verification_level integer,
  new_verification_badge text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_user_id uuid;
  result json;
BEGIN
  -- Get the calling user
  admin_user_id := auth.uid();
  
  -- Verify the admin has permission (verification_level >= 3)
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = admin_user_id AND verification_level >= 3
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions for verification operations';
  END IF;
  
  -- Validate verification level
  IF new_verification_level < 0 OR new_verification_level > 4 THEN
    RAISE EXCEPTION 'Invalid verification level';
  END IF;
  
  -- Update the target user's verification
  UPDATE public.profiles
  SET 
    verification_level = new_verification_level,
    verification_badge = new_verification_badge,
    verified_at = CASE 
      WHEN new_verification_level > verification_level THEN now() 
      ELSE verified_at 
    END,
    verifier_user_id = CASE 
      WHEN new_verification_level > verification_level THEN admin_user_id 
      ELSE verifier_user_id 
    END,
    updated_at = now()
  WHERE id = target_user_id
  RETURNING to_jsonb(profiles.*) INTO result;
  
  RETURN result;
END;
$$;

-- Create a function to request verification (user-facing)
CREATE OR REPLACE FUNCTION request_verification(
  requested_level integer,
  documentation_urls text[] DEFAULT NULL,
  reason text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id uuid;
  current_level integer;
  result json;
BEGIN
  -- Get the calling user
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Get current verification level
  SELECT verification_level INTO current_level
  FROM public.profiles
  WHERE id = user_id;
  
  -- Basic validation
  IF requested_level <= current_level THEN
    RAISE EXCEPTION 'Cannot request a lower verification level';
  END IF;
  
  IF requested_level > 2 THEN
    RAISE EXCEPTION 'High-level verification requires admin approval';
  END IF;
  
  -- For now, auto-approve basic verification (level 1)
  IF requested_level = 1 THEN
    UPDATE public.profiles
    SET 
      verification_level = 1,
      verification_badge = 'creator',
      verified_at = now(),
      updated_at = now()
    WHERE id = user_id
    RETURNING to_jsonb(profiles.*) INTO result;
  ELSE
    -- For identity verification (level 2), create a pending request
    -- This would typically integrate with a verification service
    RAISE EXCEPTION 'Identity verification requires document submission - feature coming soon';
  END IF;
  
  RETURN result;
END;
$$;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.verification_level IS 'Verification level: 0=unverified, 1=basic, 2=identity, 3=official, 4=celebrity';
COMMENT ON COLUMN public.profiles.verification_badge IS 'Verification badge type displayed to users';
COMMENT ON COLUMN public.profiles.verified_at IS 'Timestamp when verification was granted';
COMMENT ON COLUMN public.profiles.verifier_user_id IS 'ID of the admin who granted verification';
COMMENT ON FUNCTION admin_update_verification IS 'Admin function to update user verification status';
COMMENT ON FUNCTION request_verification IS 'User function to request verification upgrade'; 