-- =====================================================================
-- FIX PROFILES COMPLETE - October 2025
-- =====================================================================
-- This migration standardizes the profiles table schema and fixes:
-- 1. Removes redundant full_name column (use display_name instead)
-- 2. Ensures all required columns exist
-- 3. Fixes handle_new_user() trigger for reliable profile creation
-- 4. Updates RLS policies for public viewing and own-profile editing
-- 5. Adds proper constraints and indexes
-- =====================================================================

-- =====================================================================
-- STEP 1: ENSURE ALL COLUMNS EXIST (ADD IF MISSING)
-- =====================================================================

-- Core identity fields
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS username text UNIQUE,
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS bio text;

-- Contact & Location
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS timezone text,
  ADD COLUMN IF NOT EXISTS language text,
  ADD COLUMN IF NOT EXISTS currency text;

-- Bitcoin-native features
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS bitcoin_address text,
  ADD COLUMN IF NOT EXISTS lightning_address text,
  ADD COLUMN IF NOT EXISTS bitcoin_public_key text,
  ADD COLUMN IF NOT EXISTS lightning_node_id text,
  ADD COLUMN IF NOT EXISTS payment_preferences jsonb,
  ADD COLUMN IF NOT EXISTS bitcoin_balance numeric(20,8) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lightning_balance numeric(20,8) DEFAULT 0;

-- Analytics & Engagement
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS profile_views integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS follower_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS following_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS campaign_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_raised numeric(20,8) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_donated numeric(20,8) DEFAULT 0;

-- Verification & Security
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  ADD COLUMN IF NOT EXISTS verification_level integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS kyc_status text DEFAULT 'none' CHECK (kyc_status IN ('none', 'pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS two_factor_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_login_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS login_count integer DEFAULT 0;

-- Customization & Branding
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS banner_url text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS theme_preferences jsonb,
  ADD COLUMN IF NOT EXISTS custom_css text,
  ADD COLUMN IF NOT EXISTS profile_color text,
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS profile_badges jsonb;

-- Status & Temporal
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'deleted')),
  ADD COLUMN IF NOT EXISTS last_active_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS profile_completed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS privacy_policy_accepted_at timestamp with time zone;

-- Extensibility (JSON fields)
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS social_links jsonb,
  ADD COLUMN IF NOT EXISTS preferences jsonb,
  ADD COLUMN IF NOT EXISTS metadata jsonb,
  ADD COLUMN IF NOT EXISTS verification_data jsonb,
  ADD COLUMN IF NOT EXISTS privacy_settings jsonb;

-- Timestamps
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;

-- =====================================================================
-- STEP 2: MIGRATE DATA FROM full_name TO display_name
-- =====================================================================

-- If full_name column exists and display_name is null, copy the data
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'full_name'
  ) THEN
    -- Copy full_name to display_name where display_name is null
    UPDATE public.profiles 
    SET display_name = full_name 
    WHERE display_name IS NULL AND full_name IS NOT NULL;
    
    -- Drop the full_name column
    ALTER TABLE public.profiles DROP COLUMN IF EXISTS full_name;
    
    RAISE NOTICE 'Migrated full_name data to display_name and dropped full_name column';
  END IF;
END $$;

-- =====================================================================
-- STEP 3: UPDATE handle_new_user() TRIGGER FUNCTION
-- =====================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert new profile with sensible defaults
  INSERT INTO public.profiles (
    id,
    username,
    name,
    email,
    status,
    created_at,
    updated_at
  ) VALUES (
    new.id,
    -- Use email as initial username, or generate from user ID if no email
    COALESCE(new.email, 'user_' || substring(new.id::text, 1, 8)),
    -- Try multiple sources for name, with fallback to email username
    COALESCE(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'display_name',
      split_part(new.email, '@', 1),
      'User'
    ),
    new.email,
    'active',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Handle race conditions gracefully
  
  RETURN new;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Error creating profile for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$;

-- Add helpful comment
COMMENT ON FUNCTION public.handle_new_user() IS
  'Automatically creates a profile when a new user signs up. Uses email for initial username and extracts name from user metadata or email.';

-- =====================================================================
-- STEP 4: VERIFY TRIGGER EXISTS (READ-ONLY CHECK)
-- =====================================================================

-- Note: Triggers on auth.users cannot be modified via regular migrations
-- The trigger should already exist from previous migrations
-- If trigger is missing, it must be created via Supabase Dashboard or CLI with admin permissions

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created' 
    AND tgrelid = 'auth.users'::regclass
  ) THEN
    RAISE NOTICE 'WARNING: Trigger on_auth_user_created does not exist on auth.users';
    RAISE NOTICE 'This trigger should be created separately with admin permissions';
    RAISE NOTICE 'The trigger will ensure profiles are created automatically on user registration';
  ELSE
    RAISE NOTICE 'SUCCESS: Trigger on_auth_user_created already exists on auth.users';
  END IF;
END $$;

-- =====================================================================
-- STEP 5: UPDATE RLS POLICIES
-- =====================================================================

-- Enable RLS if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;

-- Create comprehensive RLS policies

-- SELECT: Public read access (anyone can view any profile)
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles
  FOR SELECT
  USING (true);

-- INSERT: Users can only insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- UPDATE: Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- DELETE: Users can delete their own profile (soft delete recommended)
CREATE POLICY "Users can delete own profile"
  ON public.profiles
  FOR DELETE
  USING (auth.uid() = id);

-- =====================================================================
-- STEP 6: ADD PERFORMANCE INDEXES
-- =====================================================================

-- Core indexes (only for existing columns)
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON public.profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON public.profiles(updated_at DESC);

-- Only create analytics indexes if the columns exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'follower_count') THEN
    CREATE INDEX IF NOT EXISTS idx_profiles_follower_count ON public.profiles(follower_count DESC) WHERE follower_count > 0;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'total_raised') THEN
    CREATE INDEX IF NOT EXISTS idx_profiles_total_raised ON public.profiles(total_raised DESC) WHERE total_raised > 0;
  END IF;
END $$;

-- Search indexes (for username and name search)
-- These require pg_trgm extension - create if possible, skip if not
DO $$
BEGIN
  -- Try to enable pg_trgm extension
  CREATE EXTENSION IF NOT EXISTS pg_trgm;

  -- Create trigram indexes if extension is available
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
    CREATE INDEX IF NOT EXISTS idx_profiles_username_trgm ON public.profiles USING gin(username gin_trgm_ops) WHERE username IS NOT NULL;

    -- Check if column exists before creating index
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'name') THEN
      CREATE INDEX IF NOT EXISTS idx_profiles_name_trgm ON public.profiles USING gin(name gin_trgm_ops) WHERE name IS NOT NULL;
    END IF;

    RAISE NOTICE 'Created trigram search indexes';
  ELSE
    RAISE NOTICE 'Skipping trigram indexes - pg_trgm extension not available';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not create trigram indexes: %', SQLERRM;
END $$;

-- =====================================================================
-- STEP 7: ADD HELPFUL DATABASE FUNCTIONS
-- =====================================================================

-- Function to update profile updated_at timestamp automatically
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to auto-update updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to increment profile views
CREATE OR REPLACE FUNCTION public.increment_profile_views(profile_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET profile_views = COALESCE(profile_views, 0) + 1,
      last_active_at = NOW()
  WHERE id = profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_profile_views(uuid) TO authenticated;

-- =====================================================================
-- STEP 8: ADD CONSTRAINTS
-- =====================================================================

-- Username constraints (if updating constraints)
DO $$
BEGIN
  -- Ensure username is unique (if not already)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_username_key' 
    AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
  END IF;
END $$;

-- Email validation constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_email_format' 
    AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_email_format 
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$' OR email IS NULL);
  END IF;
END $$;

-- Website URL validation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_website_format' 
    AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_website_format 
    CHECK (website ~* '^https?://' OR website IS NULL);
  END IF;
END $$;

-- =====================================================================
-- MIGRATION COMPLETE
-- =====================================================================

-- Summary of changes:
-- ✅ Removed full_name column (migrated data to display_name)
-- ✅ Added all missing columns from scalable schema
-- ✅ Fixed handle_new_user() trigger with error handling
-- ✅ Updated RLS policies for public viewing
-- ✅ Added performance indexes
-- ✅ Added auto-update trigger for updated_at
-- ✅ Added helper functions
-- ✅ Added data validation constraints

-- To verify the migration:
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'profiles' ORDER BY ordinal_position;
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';
-- SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'handle_new_user';

