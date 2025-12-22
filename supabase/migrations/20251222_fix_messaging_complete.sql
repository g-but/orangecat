-- Complete Messaging System Fix Migration
-- This migration ensures all messaging functions and views are properly set up
-- Run this to fix any messaging-related database issues

-- Enable RLS on messaging tables if not already enabled
ALTER TABLE IF EXISTS public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- Drop existing problematic functions to recreate them cleanly
DROP FUNCTION IF EXISTS public.get_participant_read_times(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_conversation_messages(uuid, integer) CASCADE;
DROP FUNCTION IF EXISTS public.get_conversation_messages(uuid, integer, timestamptz) CASCADE;

-- Create or replace get_user_conversations function
-- This returns conversations with participants and unread counts
CREATE OR REPLACE FUNCTION public.get_user_conversations(p_user_id uuid)
RETURNS TABLE(
  id uuid,
  title text,
  is_group boolean,
  created_at timestamptz,
  updated_at timestamptz,
  last_message_at timestamptz,
  last_message_preview text,
  last_message_sender_id uuid,
  created_by uuid,
  participants jsonb,
  unread_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.title,
    c.is_group,
    c.created_at,
    c.updated_at,
    c.last_message_at,
    c.last_message_preview,
    c.last_message_sender_id,
    c.created_by,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'user_id', cp2.user_id,
          'username', COALESCE(p2.username, ''),
          'name', COALESCE(p2.name, ''),
          'avatar_url', p2.avatar_url,
          'role', cp2.role,
          'joined_at', cp2.joined_at,
          'last_read_at', cp2.last_read_at,
          'is_active', cp2.is_active
        )
      )
      FROM conversation_participants cp2
      LEFT JOIN profiles p2 ON cp2.user_id = p2.id
      WHERE cp2.conversation_id = c.id
    ) as participants,
    COALESCE((
      SELECT COUNT(m.id)
      FROM messages m
      WHERE m.conversation_id = c.id
        AND m.sender_id != p_user_id
        AND m.is_deleted = false
        AND (cp_user.last_read_at IS NULL OR m.created_at > cp_user.last_read_at)
    ), 0)::bigint as unread_count
  FROM conversations c
  JOIN conversation_participants cp_user ON c.id = cp_user.conversation_id AND cp_user.user_id = p_user_id
  WHERE cp_user.is_active = true
  ORDER BY c.last_message_at DESC NULLS LAST
  LIMIT 50;
END;
$$;

-- Create or replace get_total_unread_count function
CREATE OR REPLACE FUNCTION public.get_total_unread_count(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  total_count integer := 0;
BEGIN
  SELECT COALESCE(SUM(
    (SELECT COUNT(m.id)
     FROM public.messages m
     WHERE m.conversation_id = cp.conversation_id
       AND m.sender_id != p_user_id
       AND m.is_deleted = false
       AND (cp.last_read_at IS NULL OR m.created_at > cp.last_read_at))
  ), 0)::integer INTO total_count
  FROM public.conversation_participants cp
  WHERE cp.user_id = p_user_id
    AND cp.is_active = true;

  RETURN total_count;
END;
$$;

-- Create or replace mark_conversation_read function
CREATE OR REPLACE FUNCTION public.mark_conversation_read(
  p_conversation_id uuid,
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.conversation_participants
  SET last_read_at = NOW()
  WHERE conversation_id = p_conversation_id
    AND user_id = p_user_id;
END;
$$;

-- Create or replace send_message function
CREATE OR REPLACE FUNCTION public.send_message(
  p_conversation_id uuid,
  p_sender_id uuid,
  p_content text,
  p_message_type text DEFAULT 'text',
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_message_id uuid;
  is_participant boolean;
BEGIN
  -- Check if sender is a participant
  SELECT EXISTS(
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = p_conversation_id
      AND user_id = p_sender_id
      AND is_active = true
  ) INTO is_participant;

  IF NOT is_participant THEN
    RAISE EXCEPTION 'User is not a participant in this conversation';
  END IF;

  -- Insert the message
  INSERT INTO public.messages (
    conversation_id,
    sender_id,
    content,
    message_type,
    metadata
  ) VALUES (
    p_conversation_id,
    p_sender_id,
    p_content,
    p_message_type,
    p_metadata
  ) RETURNING id INTO new_message_id;

  -- Update conversation metadata
  UPDATE public.conversations
  SET
    last_message_at = NOW(),
    last_message_preview = LEFT(p_content, 100),
    last_message_sender_id = p_sender_id,
    updated_at = NOW()
  WHERE id = p_conversation_id;

  -- Update sender's last_read_at
  UPDATE public.conversation_participants
  SET last_read_at = NOW()
  WHERE conversation_id = p_conversation_id
    AND user_id = p_sender_id;

  RETURN new_message_id;
END;
$$;

-- Create or replace message_details view for efficient message fetching
DROP VIEW IF EXISTS public.message_details;
CREATE OR REPLACE VIEW public.message_details AS
SELECT
  m.id,
  m.conversation_id,
  m.sender_id,
  m.content,
  m.message_type,
  m.metadata,
  m.created_at,
  m.updated_at,
  m.is_deleted,
  m.edited_at,
  jsonb_build_object(
    'id', p.id,
    'username', COALESCE(p.username, ''),
    'name', COALESCE(p.name, ''),
    'avatar_url', p.avatar_url
  ) as sender,
  false as is_read,
  true as is_delivered,
  'delivered' as status
FROM public.messages m
LEFT JOIN public.profiles p ON m.sender_id = p.id
WHERE m.is_deleted = false;

-- Grant necessary permissions
GRANT SELECT ON public.message_details TO authenticated;
GRANT SELECT ON public.message_details TO anon;

-- Enable realtime for messaging tables
DO $$
BEGIN
  -- Check if realtime publication exists and add tables
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    -- Try to add tables to realtime publication (ignore errors if already added)
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    EXCEPTION WHEN duplicate_object THEN
      NULL; -- Table already in publication
    END;

    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;

    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END;
$$;

-- Ensure RLS policies exist for messaging tables
-- Drop and recreate policies to ensure they're correct

-- Conversations policies
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
CREATE POLICY "Users can view their conversations" ON public.conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = id
        AND cp.user_id = auth.uid()
        AND cp.is_active = true
    )
  );

DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
CREATE POLICY "Users can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can update their conversations" ON public.conversations;
CREATE POLICY "Users can update their conversations" ON public.conversations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = id
        AND cp.user_id = auth.uid()
        AND cp.is_active = true
    )
  );

-- Messages policies
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages in their conversations" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversation_id
        AND cp.user_id = auth.uid()
        AND cp.is_active = true
    )
  );

DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.messages;
CREATE POLICY "Users can send messages to their conversations" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversation_id
        AND cp.user_id = auth.uid()
        AND cp.is_active = true
    )
  );

DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
CREATE POLICY "Users can update their own messages" ON public.messages
  FOR UPDATE USING (sender_id = auth.uid());

-- Conversation participants policies
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON public.conversation_participants;
CREATE POLICY "Users can view participants in their conversations" ON public.conversation_participants
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversation_id
        AND cp.user_id = auth.uid()
        AND cp.is_active = true
    )
  );

DROP POLICY IF EXISTS "Users can update their own participation" ON public.conversation_participants;
CREATE POLICY "Users can update their own participation" ON public.conversation_participants
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert participants" ON public.conversation_participants;
CREATE POLICY "Users can insert participants" ON public.conversation_participants
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND c.created_by = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
  ON public.messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender
  ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_active
  ON public.conversation_participants(user_id, is_active)
  WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation
  ON public.conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message
  ON public.conversations(last_message_at DESC NULLS LAST);

-- Success message
SELECT 'Messaging system migration completed successfully' as status;
