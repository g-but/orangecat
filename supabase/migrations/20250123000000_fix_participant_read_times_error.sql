-- =============================================
-- FIX PARTICIPANT READ TIMES DATABASE ERROR
-- This migration addresses the "participant_read_times does not exist" error
-- by ensuring all database functions reference the correct table names
-- =============================================

-- Drop any problematic functions that might reference incorrect table names
DROP FUNCTION IF EXISTS public.get_participant_read_times(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_total_unread_count_old(uuid) CASCADE;

-- Recreate the get_total_unread_count function with correct table references
CREATE OR REPLACE FUNCTION public.get_total_unread_count(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  total_count integer;
BEGIN
  SELECT COALESCE(SUM(unread), 0)::integer INTO total_count
  FROM (
    SELECT
      cp.conversation_id,
      COUNT(m.id) as unread
    FROM public.conversation_participants cp
    LEFT JOIN public.messages m ON m.conversation_id = cp.conversation_id
      AND m.sender_id != p_user_id
      AND m.is_deleted = false
      AND (cp.last_read_at IS NULL OR m.created_at > cp.last_read_at)
    WHERE cp.user_id = p_user_id
      AND cp.is_active = true
    GROUP BY cp.conversation_id
  ) counts;

  RETURN total_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Ensure the conversation_participants table has all required columns
DO $$
BEGIN
  -- Add last_read_at column if it doesn't exist
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

  -- Add is_active column if it doesn't exist
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

-- Create a helper function to get participant read times for a conversation
CREATE OR REPLACE FUNCTION public.get_conversation_participant_read_times(p_conversation_id uuid)
RETURNS TABLE(user_id uuid, last_read_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT cp.user_id, cp.last_read_at
  FROM public.conversation_participants cp
  WHERE cp.conversation_id = p_conversation_id
    AND cp.is_active = true;
END;
$$;

COMMENT ON FUNCTION public.get_conversation_participant_read_times(uuid) IS 'Gets participant read times for a specific conversation';

-- Update the unread count function to use explicit table references
CREATE OR REPLACE FUNCTION public.get_total_unread_count(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  total_count integer := 0;
  conv_record RECORD;
BEGIN
  -- For each conversation the user is part of
  FOR conv_record IN
    SELECT cp.conversation_id, cp.last_read_at
    FROM public.conversation_participants cp
    WHERE cp.user_id = p_user_id
      AND cp.is_active = true
  LOOP
    -- Count unread messages in this conversation
    SELECT total_count + COALESCE((
      SELECT COUNT(m.id)
      FROM public.messages m
      WHERE m.conversation_id = conv_record.conversation_id
        AND m.sender_id != p_user_id
        AND m.is_deleted = false
        AND (conv_record.last_read_at IS NULL OR m.created_at > conv_record.last_read_at)
    ), 0) INTO total_count;
  END LOOP;

  RETURN total_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_total_unread_count(uuid) IS 'Calculates total unread message count for a user across all conversations';

SELECT '✅ Fixed participant read times database error' as status;



