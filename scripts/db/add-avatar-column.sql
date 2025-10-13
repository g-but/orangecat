-- Add avatar_url column to profiles table if it doesn't exist
-- Run this manually in your Supabase SQL Editor

-- Check if column exists and add it if it doesn't
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'avatar_url'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_url text;
    RAISE NOTICE 'avatar_url column added to profiles table';
  ELSE
    RAISE NOTICE 'avatar_url column already exists in profiles table';
  END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position; 