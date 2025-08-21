-- =====================================================================
-- URGENT PROFILES SCHEMA FIX
-- =====================================================================
-- Migration: 20250108200000_fix_profiles_schema_urgent.sql
-- Created: 2025-01-08
-- Purpose: Fix critical schema mismatch in profiles table
-- 
-- ISSUE: The profiles table has different columns than the application expects
-- Current: id, username, full_name, avatar_url, website, created_at, updated_at
-- Expected: id, username, display_name, bio, avatar_url, banner_url, bitcoin_address, lightning_address, created_at, updated_at
-- =====================================================================

-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS bitcoin_address TEXT,
ADD COLUMN IF NOT EXISTS lightning_address TEXT;

-- Migrate data from full_name to display_name
UPDATE public.profiles 
SET display_name = full_name 
WHERE full_name IS NOT NULL AND display_name IS NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON public.profiles(display_name);

-- Update RLS policies to ensure they work with new schema
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create or replace function to handle profile updates
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
  
  -- Update the profile with new schema
  UPDATE public.profiles
  SET 
    username = COALESCE((profile_data->>'username')::text, username),
    display_name = COALESCE((profile_data->>'display_name')::text, display_name),
    bio = COALESCE((profile_data->>'bio')::text, bio),
    bitcoin_address = COALESCE((profile_data->>'bitcoin_address')::text, bitcoin_address),
    lightning_address = COALESCE((profile_data->>'lightning_address')::text, lightning_address),
    avatar_url = COALESCE((profile_data->>'avatar_url')::text, avatar_url),
    banner_url = COALESCE((profile_data->>'banner_url')::text, banner_url),
    website = COALESCE((profile_data->>'website')::text, website),
    updated_at = NOW()
  WHERE id = user_id
  RETURNING 
    id, username, display_name, bio, bitcoin_address, lightning_address, 
    avatar_url, banner_url, website, created_at, updated_at
  INTO result;
  
  -- If no profile exists, create one
  IF result IS NULL THEN
    INSERT INTO public.profiles (
      id, username, display_name, bio, bitcoin_address, lightning_address,
      avatar_url, banner_url, website, created_at, updated_at
    ) VALUES (
      user_id,
      (profile_data->>'username')::text,
      (profile_data->>'display_name')::text,
      (profile_data->>'bio')::text,
      (profile_data->>'bitcoin_address')::text,
      (profile_data->>'lightning_address')::text,
      (profile_data->>'avatar_url')::text,
      (profile_data->>'banner_url')::text,
      (profile_data->>'website')::text,
      NOW(),
      NOW()
    )
    RETURNING 
      id, username, display_name, bio, bitcoin_address, lightning_address, 
      avatar_url, banner_url, website, created_at, updated_at
    INTO result;
  END IF;
  
  -- Return the result
  IF result IS NULL THEN
    RETURN jsonb_build_object('error', 'Profile operation failed');
  ELSE
    RETURN jsonb_build_object('success', true, 'data', to_jsonb(result));
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_profile(jsonb) TO authenticated;

-- Create or replace trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update the handle_new_user function to create profiles with correct schema
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, created_at, updated_at)
  VALUES (
    new.id,
    split_part(new.email, '@', 1), -- Use email username part as initial username
    split_part(new.email, '@', 1), -- Use email username part as initial display name
    NOW(),
    NOW()
  );
  RETURN new;
EXCEPTION
  WHEN others THEN
    -- Log the error but don't fail the transaction
    RAISE WARNING 'Error creating profile for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Log successful migration
DO $$
BEGIN
  RAISE NOTICE '🎯 PROFILES SCHEMA FIXED! 🎯';
  RAISE NOTICE 'Added missing columns: display_name, bio, banner_url, bitcoin_address, lightning_address';
  RAISE NOTICE 'Migrated full_name data to display_name';
  RAISE NOTICE 'Updated RLS policies and functions';
  RAISE NOTICE 'Profile functionality should now work correctly! ✅';
END $$; 