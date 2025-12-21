-- =============================================
-- ADD MISSING RLS POLICIES FOR conversation_participants
-- This fixes the "Failed to search conversations" error
-- =============================================

-- Add is_active column if it doesn't exist (used for soft-deleting participants)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'conversation_participants' 
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.conversation_participants 
    ADD COLUMN is_active boolean DEFAULT true NOT NULL;
    RAISE NOTICE '✅ Added is_active column to conversation_participants';
  END IF;
END $$;

-- Add last_read_at column if it doesn't exist (for tracking read status)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'conversation_participants' 
    AND column_name = 'last_read_at'
  ) THEN
    ALTER TABLE public.conversation_participants 
    ADD COLUMN last_read_at timestamptz;
    RAISE NOTICE '✅ Added last_read_at column to conversation_participants';
  END IF;
END $$;

-- Create a SECURITY DEFINER function to check if user is a participant (avoids RLS recursion)
-- This function bypasses RLS by using SECURITY DEFINER and SET LOCAL to disable RLS
CREATE OR REPLACE FUNCTION public.user_is_participant(p_conversation_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Temporarily disable RLS for this function execution
  SET LOCAL row_security = off;
  RETURN EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = p_conversation_id
    AND user_id = p_user_id
    AND is_active = true
  );
END;
$$;

-- Add RLS policies for conversation_participants table
-- Users can view participants in conversations they're part of
-- Simplified to avoid recursion - only check non-recursive conditions
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON conversation_participants;
CREATE POLICY "Users can view participants in their conversations" ON conversation_participants FOR SELECT 
  USING (
    -- User can see their own participant record
    user_id = auth.uid()
    OR
    -- User can see participants in conversations they created
    conversation_id IN (
      SELECT id FROM conversations WHERE created_by = auth.uid()
    )
  );

-- Users can insert participants when creating conversations
-- This allows users to add themselves and others when they create a conversation
DROP POLICY IF EXISTS "Users can add participants to their conversations" ON conversation_participants;
CREATE POLICY "Users can add participants to their conversations" ON conversation_participants FOR INSERT 
  WITH CHECK (
    -- Allow if the user created the conversation
    conversation_id IN (
      SELECT id FROM conversations WHERE created_by = auth.uid()
    )
  );

-- Users can update their own participant record
DROP POLICY IF EXISTS "Users can update their own participant record" ON conversation_participants;
CREATE POLICY "Users can update their own participant record" ON conversation_participants FOR UPDATE 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_conversation ON conversation_participants(user_id, conversation_id);

SELECT '✅ Added RLS policies for conversation_participants table' as status;

