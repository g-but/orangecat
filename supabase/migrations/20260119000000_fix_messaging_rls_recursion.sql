-- =============================================
-- FIX MESSAGING RLS RECURSION ISSUE
-- Replaces complex policies with simple, non-recursive ones
-- Created: 2026-01-19
-- =============================================

-- Drop all existing policies that could cause recursion
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can add participants to their conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can update their own participant record" ON conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_policy" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view own conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can join conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can update own participant record" ON conversation_participants;
DROP POLICY IF EXISTS "Users can leave conversations" ON conversation_participants;

-- Create simple, non-recursive SELECT policy
-- Users can only see their own participant records
CREATE POLICY "Users can view own conversations"
ON conversation_participants
FOR SELECT
USING (
  user_id = auth.uid()
);

-- Create simple INSERT policy
-- Users can only insert their own participant records
CREATE POLICY "Users can join conversations"
ON conversation_participants
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
);

-- Create simple UPDATE policy
-- Users can only update their own participant records
CREATE POLICY "Users can update own participant record"
ON conversation_participants
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create simple DELETE policy
-- Users can only delete their own participant records (leave conversation)
CREATE POLICY "Users can leave conversations"
ON conversation_participants
FOR DELETE
USING (user_id = auth.uid());

-- Verify policies were created
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'conversation_participants';

  RAISE NOTICE '✅ Created % RLS policies for conversation_participants', policy_count;

  IF policy_count < 4 THEN
    RAISE EXCEPTION 'Expected at least 4 policies, but found %', policy_count;
  END IF;
END $$;

SELECT '✅ Fixed messaging RLS recursion - policies are now simple and non-recursive' as status;
