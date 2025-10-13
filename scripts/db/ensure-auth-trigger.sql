-- =====================================================================
-- ENSURE AUTH TRIGGER EXISTS
-- =====================================================================
-- This script creates the trigger on auth.users if it doesn't exist
-- Run this AFTER applying the main migration if you get a trigger warning
-- =====================================================================

-- Check if trigger exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created' 
    AND tgrelid = 'auth.users'::regclass
  ) THEN
    RAISE NOTICE '✅ Trigger already exists - no action needed';
  ELSE
    RAISE NOTICE '⚠️  Trigger does not exist - will attempt to create it';
    
    -- Attempt to create the trigger
    -- Note: This may require admin permissions
    BEGIN
      EXECUTE 'DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users';
      EXECUTE 'CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_new_user()';
      
      RAISE NOTICE '✅ Trigger created successfully';
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE '❌ Failed to create trigger: %', SQLERRM;
        RAISE NOTICE 'You may need to create this trigger via Supabase Dashboard or with admin permissions';
    END;
  END IF;
END $$;

-- Verify the trigger exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'on_auth_user_created' 
      AND tgrelid = 'auth.users'::regclass
    ) THEN '✅ VERIFIED: Trigger exists and will auto-create profiles'
    ELSE '❌ WARNING: Trigger missing - profiles will NOT be auto-created on registration'
  END as trigger_status;


