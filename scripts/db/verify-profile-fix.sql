-- =====================================================================
-- VERIFICATION SCRIPT FOR PROFILE BACKEND FIX
-- =====================================================================
-- Run this in Supabase SQL Editor after applying the migration
-- =====================================================================

-- =====================================================================
-- 1. CHECK SCHEMA - Verify columns exist
-- =====================================================================
SELECT 
  '✅ Schema Check' as test_name,
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- =====================================================================
-- 2. VERIFY full_name IS GONE
-- =====================================================================
SELECT 
  '✅ full_name Removed Check' as test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'profiles' AND column_name = 'full_name'
    ) THEN '❌ FAIL: full_name column still exists!'
    ELSE '✅ PASS: full_name column successfully removed'
  END as result;

-- =====================================================================
-- 3. VERIFY display_name EXISTS
-- =====================================================================
SELECT 
  '✅ display_name Check' as test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'profiles' AND column_name = 'display_name'
    ) THEN '✅ PASS: display_name column exists'
    ELSE '❌ FAIL: display_name column missing!'
  END as result;

-- =====================================================================
-- 4. CHECK TRIGGER EXISTS
-- =====================================================================
SELECT 
  '✅ Trigger Check' as test_name,
  proname as function_name,
  CASE 
    WHEN proname = 'handle_new_user' THEN '✅ PASS: Trigger function exists'
    ELSE '❌ FAIL: Trigger function missing'
  END as result
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- =====================================================================
-- 5. CHECK RLS POLICIES
-- =====================================================================
SELECT 
  '✅ RLS Policies Check' as test_name,
  policyname, 
  cmd as command,
  CASE 
    WHEN policyname LIKE '%viewable%' THEN '✅ Public viewing enabled'
    WHEN policyname LIKE '%insert%' THEN '✅ Insert policy exists'
    WHEN policyname LIKE '%update%' THEN '✅ Update policy exists'
    ELSE policyname
  END as description
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'profiles'
ORDER BY policyname;

-- =====================================================================
-- 6. CHECK RLS IS ENABLED
-- =====================================================================
SELECT 
  '✅ RLS Enabled Check' as test_name,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ PASS: RLS is enabled'
    ELSE '❌ FAIL: RLS is NOT enabled!'
  END as result
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'profiles';

-- =====================================================================
-- 7. CHECK INDEXES
-- =====================================================================
SELECT 
  '✅ Indexes Check' as test_name,
  indexname,
  '✅ Index exists' as status
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename = 'profiles'
ORDER BY indexname;

-- =====================================================================
-- 8. COUNT EXISTING PROFILES
-- =====================================================================
SELECT 
  '✅ Profile Count' as test_name,
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN username IS NOT NULL THEN 1 END) as profiles_with_username,
  COUNT(CASE WHEN display_name IS NOT NULL THEN 1 END) as profiles_with_display_name,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Profiles exist'
    ELSE '⚠️  No profiles yet (expected if new database)'
  END as status
FROM public.profiles;

-- =====================================================================
-- 9. CHECK FOR ORPHANED DATA
-- =====================================================================
SELECT 
  '✅ Data Integrity Check' as test_name,
  COUNT(*) as orphaned_profiles
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id = p.id
);

-- =====================================================================
-- 10. TEST TRIGGER (Read-only check)
-- =====================================================================
SELECT 
  '✅ Trigger Attachment Check' as test_name,
  tgname as trigger_name,
  tgrelid::regclass as attached_to,
  '✅ Trigger properly attached' as status
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- =====================================================================
-- SUMMARY
-- =====================================================================
SELECT 
  '🎉 VERIFICATION COMPLETE' as status,
  'If all checks above show ✅, migration was successful!' as message;

-- =====================================================================
-- NEXT STEPS
-- =====================================================================
-- Run these commands to test the complete flow:
-- 
-- 1. TEST REGISTRATION:
--    Go to your app and register a new test user
--    
-- 2. VERIFY PROFILE WAS CREATED:
--    SELECT * FROM profiles WHERE email = 'your-test-email@example.com';
--    
-- 3. TEST PROFILE EDITING:
--    Update the profile via your app's UI
--    
-- 4. VERIFY UPDATES:
--    SELECT username, display_name, bio, bitcoin_address 
--    FROM profiles 
--    WHERE email = 'your-test-email@example.com';
--
-- 5. TEST PUBLIC VIEWING:
--    Access /profile/[username] as a different user
-- =====================================================================


