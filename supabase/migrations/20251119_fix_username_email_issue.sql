-- Fix handle_new_user function to use email prefix instead of full email address
-- and update existing profiles that have email addresses as usernames

-- Step 1: Fix the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, name, created_at, updated_at)
  VALUES (
    NEW.id,
    -- Use email prefix (before @) instead of full email
    COALESCE(
      SPLIT_PART(NEW.email, '@', 1),
      'user_' || SUBSTRING(NEW.id::TEXT, 1, 8)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      SPLIT_PART(NEW.email, '@', 1),
      'User'
    ),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Update existing profiles that have email addresses as usernames
-- This handles profiles created before this fix
DO $$
DECLARE
  profile_record RECORD;
  new_username TEXT;
  counter INT;
BEGIN
  FOR profile_record IN
    SELECT id, username, email
    FROM public.profiles
    WHERE username LIKE '%@%'
  LOOP
    -- Extract username from email (part before @)
    new_username := SPLIT_PART(profile_record.username, '@', 1);
    counter := 0;

    -- Check if username already exists, add suffix if needed
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = new_username AND id != profile_record.id) LOOP
      counter := counter + 1;
      new_username := SPLIT_PART(profile_record.username, '@', 1) || counter::TEXT;
    END LOOP;

    -- Update the username
    UPDATE public.profiles
    SET
      username = new_username,
      updated_at = NOW()
    WHERE id = profile_record.id;

    RAISE NOTICE 'Updated profile % from % to %', profile_record.id, profile_record.username, new_username;
  END LOOP;
END $$;
