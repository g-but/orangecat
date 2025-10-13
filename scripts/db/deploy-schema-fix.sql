-- Deploy Schema Fix for OrangeCat Profiles
-- This script ensures proper schema and RLS policies for profile editing

-- Ensure all expected columns exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banner_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bitcoin_address text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS lightning_address text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS twitter text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS github text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS public_profile boolean DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS allow_donations boolean DEFAULT true;

-- Fix RLS policies to allow users to read their own updated profiles
DROP POLICY IF EXISTS "Users can select their own profile" ON public.profiles;
CREATE POLICY "Users can select their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR true); -- Allow public read but authenticated users can read their own

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Ensure updated_at trigger exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create or replace the update_profile RPC function
CREATE OR REPLACE FUNCTION public.update_profile(profile_data jsonb)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
  user_id uuid := auth.uid();
BEGIN
  -- Check if user is authenticated
  IF user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'User not authenticated');
  END IF;
  
  -- Update the profile
  UPDATE public.profiles
  SET 
    username = COALESCE((profile_data->>'username')::text, username),
    full_name = COALESCE((profile_data->>'full_name')::text, (profile_data->>'display_name')::text, full_name),
    bio = COALESCE((profile_data->>'bio')::text, bio),
    bitcoin_address = COALESCE((profile_data->>'bitcoin_address')::text, bitcoin_address),
    lightning_address = COALESCE((profile_data->>'lightning_address')::text, lightning_address),
    avatar_url = COALESCE((profile_data->>'avatar_url')::text, avatar_url),
    banner_url = COALESCE((profile_data->>'banner_url')::text, banner_url),
    location = COALESCE((profile_data->>'location')::text, location),
    twitter = COALESCE((profile_data->>'twitter')::text, twitter),
    linkedin = COALESCE((profile_data->>'linkedin')::text, linkedin),
    github = COALESCE((profile_data->>'github')::text, github),
    public_profile = COALESCE((profile_data->>'public_profile')::boolean, public_profile),
    allow_donations = COALESCE((profile_data->>'allow_donations')::boolean, allow_donations),
    updated_at = NOW()
  WHERE id = user_id
  RETURNING to_jsonb(profiles.*) INTO result;
  
  -- Return the updated profile or error
  IF result IS NULL THEN
    RETURN jsonb_build_object('error', 'Profile not found or update failed');
  ELSE
    RETURN jsonb_build_object('success', true, 'data', result);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_profile(jsonb) TO authenticated;

-- Fix any profiles missing display names
UPDATE public.profiles 
SET full_name = split_part(username, '@', 1)
WHERE full_name IS NULL AND username IS NOT NULL;

-- Ensure all profiles have a proper username if missing
UPDATE public.profiles 
SET username = COALESCE(username, 'user_' || substr(id::text, 1, 8))
WHERE username IS NULL; 