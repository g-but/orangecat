-- Fix profiles table schema to match application expectations
-- Run this in your Supabase SQL Editor

-- Add missing columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bitcoin_address text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS lightning_address text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banner_url text;

-- Add constraints for data validation
ALTER TABLE public.profiles
  ADD CONSTRAINT IF NOT EXISTS valid_bitcoin_address CHECK (
    bitcoin_address IS NULL OR 
    bitcoin_address ~ '^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$'
  );

ALTER TABLE public.profiles
  ADD CONSTRAINT IF NOT EXISTS valid_lightning_address CHECK (
    lightning_address IS NULL OR 
    lightning_address ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_bitcoin_address ON public.profiles(bitcoin_address);
CREATE INDEX IF NOT EXISTS idx_profiles_lightning_address ON public.profiles(lightning_address);

-- Create or replace function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at if it doesn't exist
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create or replace the RPC function for profile updates that was missing
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
    display_name = COALESCE((profile_data->>'display_name')::text, display_name),
    bio = COALESCE((profile_data->>'bio')::text, bio),
    bitcoin_address = COALESCE((profile_data->>'bitcoin_address')::text, bitcoin_address),
    lightning_address = COALESCE((profile_data->>'lightning_address')::text, lightning_address),
    avatar_url = COALESCE((profile_data->>'avatar_url')::text, avatar_url),
    banner_url = COALESCE((profile_data->>'banner_url')::text, banner_url),
    updated_at = NOW()
  WHERE id = user_id
  RETURNING 
    id, username, display_name, bio, bitcoin_address, lightning_address, 
    avatar_url, banner_url, created_at, updated_at
  INTO result;
  
  -- Return the updated profile or error
  IF result IS NULL THEN
    RETURN jsonb_build_object('error', 'Profile not found or update failed');
  ELSE
    RETURN jsonb_build_object('success', true, 'data', to_jsonb(result));
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.update_profile(jsonb) TO authenticated;

-- Update existing profile policies to be more comprehensive
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add policy for profile insertion
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Update the handle_new_user function to create profiles with proper structure
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

-- Verify the schema is now correct
DO $$
DECLARE
    missing_columns text[];
    expected_columns text[] := ARRAY['id', 'username', 'display_name', 'bio', 'bitcoin_address', 'lightning_address', 'avatar_url', 'banner_url', 'created_at', 'updated_at'];
    col text;
BEGIN
    FOR col IN SELECT unnest(expected_columns) LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'profiles' 
            AND column_name = col
            AND table_schema = 'public'
        ) THEN
            missing_columns := array_append(missing_columns, col);
        END IF;
    END LOOP;
    
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE EXCEPTION 'Missing columns in profiles table: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE 'All expected columns exist in profiles table';
    END IF;
END $$; 