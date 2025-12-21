-- =============================================
-- FIX MESSAGING SCHEMA - Add missing columns, views, and fix RLS
-- This migration addresses multiple issues:
-- 1. Missing columns on conversations table
-- 2. Missing columns on messages table
-- 3. Missing message_details and conversation_details views
-- 4. Typing indicators table
-- 5. Presence/online status table
-- =============================================

-- =============================================================================
-- 1. ADD MISSING COLUMNS TO conversations TABLE
-- =============================================================================

-- Add is_group column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'conversations'
    AND column_name = 'is_group'
  ) THEN
    ALTER TABLE public.conversations
    ADD COLUMN is_group boolean DEFAULT false NOT NULL;
    RAISE NOTICE '✅ Added is_group column to conversations';
  END IF;
END $$;

-- Add last_message_preview column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'conversations'
    AND column_name = 'last_message_preview'
  ) THEN
    ALTER TABLE public.conversations
    ADD COLUMN last_message_preview text;
    RAISE NOTICE '✅ Added last_message_preview column to conversations';
  END IF;
END $$;

-- Add last_message_sender_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'conversations'
    AND column_name = 'last_message_sender_id'
  ) THEN
    ALTER TABLE public.conversations
    ADD COLUMN last_message_sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
    RAISE NOTICE '✅ Added last_message_sender_id column to conversations';
  END IF;
END $$;

-- =============================================================================
-- 2. ADD MISSING COLUMNS TO messages TABLE
-- =============================================================================

-- Add is_deleted column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'messages'
    AND column_name = 'is_deleted'
  ) THEN
    ALTER TABLE public.messages
    ADD COLUMN is_deleted boolean DEFAULT false NOT NULL;
    RAISE NOTICE '✅ Added is_deleted column to messages';
  END IF;
END $$;

-- Add edited_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'messages'
    AND column_name = 'edited_at'
  ) THEN
    ALTER TABLE public.messages
    ADD COLUMN edited_at timestamptz;
    RAISE NOTICE '✅ Added edited_at column to messages';
  END IF;
END $$;

-- =============================================================================
-- 3. CREATE message_details VIEW
-- This view joins messages with sender profile info
-- =============================================================================

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
  p.id as sender_profile_id,
  p.username as sender_username,
  p.name as sender_name,
  p.avatar_url as sender_avatar_url,
  -- Return sender as a JSON object for easier consumption
  jsonb_build_object(
    'id', p.id,
    'username', COALESCE(p.username, ''),
    'name', COALESCE(p.name, ''),
    'avatar_url', p.avatar_url
  ) as sender
FROM public.messages m
LEFT JOIN public.profiles p ON m.sender_id = p.id
WHERE m.is_deleted = false;

COMMENT ON VIEW public.message_details IS 'Messages with sender profile information - inherits RLS from messages table';

-- =============================================================================
-- 4. CREATE conversation_details VIEW
-- This view provides conversation info with participant count
-- =============================================================================

DROP VIEW IF EXISTS public.conversation_details;
CREATE OR REPLACE VIEW public.conversation_details AS
SELECT
  c.id,
  c.title,
  c.is_group,
  c.created_by,
  c.created_at,
  c.updated_at,
  c.last_message_at,
  c.last_message_preview,
  c.last_message_sender_id,
  COALESCE(pc.participant_count, 0) as participant_count
FROM public.conversations c
LEFT JOIN (
  SELECT conversation_id, COUNT(*) as participant_count
  FROM public.conversation_participants
  WHERE is_active = true
  GROUP BY conversation_id
) pc ON c.id = pc.conversation_id;

COMMENT ON VIEW public.conversation_details IS 'Conversations with participant count - inherits RLS from conversations table';

-- =============================================================================
-- 5. CREATE typing_indicators TABLE
-- For real-time typing status like Facebook Messenger
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.typing_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  started_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz DEFAULT (now() + interval '10 seconds') NOT NULL,
  UNIQUE(conversation_id, user_id)
);

-- Enable RLS
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;

-- RLS Policies for typing indicators
DROP POLICY IF EXISTS "Users can see typing in their conversations" ON typing_indicators;
CREATE POLICY "Users can see typing in their conversations" ON typing_indicators FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Users can update their own typing status" ON typing_indicators;
CREATE POLICY "Users can update their own typing status" ON typing_indicators FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Users can remove their own typing status" ON typing_indicators;
CREATE POLICY "Users can remove their own typing status" ON typing_indicators FOR DELETE
  USING (user_id = auth.uid());

-- Upsert policy
DROP POLICY IF EXISTS "Users can upsert their own typing status" ON typing_indicators;
CREATE POLICY "Users can upsert their own typing status" ON typing_indicators FOR UPDATE
  USING (user_id = auth.uid());

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_typing_indicators_conversation ON typing_indicators(conversation_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_expires ON typing_indicators(expires_at);

-- =============================================================================
-- 6. CREATE user_presence TABLE
-- For online/offline/away status like Messenger
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_presence (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status text DEFAULT 'offline' CHECK (status IN ('online', 'away', 'offline')),
  last_seen_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- Everyone can see presence status (like Messenger)
DROP POLICY IF EXISTS "Presence is public" ON user_presence;
CREATE POLICY "Presence is public" ON user_presence FOR SELECT USING (true);

-- Users can only update their own presence
DROP POLICY IF EXISTS "Users can update their own presence" ON user_presence;
CREATE POLICY "Users can update their own presence" ON user_presence FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can modify their own presence" ON user_presence;
CREATE POLICY "Users can modify their own presence" ON user_presence FOR UPDATE
  USING (user_id = auth.uid());

-- Index for efficient presence lookups
CREATE INDEX IF NOT EXISTS idx_user_presence_status ON user_presence(status);
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON user_presence(last_seen_at);

-- =============================================================================
-- 7. CREATE HELPER FUNCTIONS
-- =============================================================================

-- Function to update conversation metadata when a message is sent
CREATE OR REPLACE FUNCTION public.update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.content, 100),
    last_message_sender_id = NEW.sender_id,
    updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update conversation on new message
DROP TRIGGER IF EXISTS update_conversation_on_message_insert ON messages;
CREATE TRIGGER update_conversation_on_message_insert
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_on_message();

-- Function to clean up expired typing indicators (call periodically)
CREATE OR REPLACE FUNCTION public.cleanup_expired_typing_indicators()
RETURNS void AS $$
BEGIN
  DELETE FROM public.typing_indicators WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update or insert typing indicator
CREATE OR REPLACE FUNCTION public.set_typing_indicator(
  p_conversation_id uuid,
  p_user_id uuid,
  p_is_typing boolean DEFAULT true
)
RETURNS void AS $$
BEGIN
  IF p_is_typing THEN
    INSERT INTO public.typing_indicators (conversation_id, user_id, started_at, expires_at)
    VALUES (p_conversation_id, p_user_id, now(), now() + interval '10 seconds')
    ON CONFLICT (conversation_id, user_id)
    DO UPDATE SET
      started_at = now(),
      expires_at = now() + interval '10 seconds';
  ELSE
    DELETE FROM public.typing_indicators
    WHERE conversation_id = p_conversation_id AND user_id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update presence
CREATE OR REPLACE FUNCTION public.update_presence(p_status text DEFAULT 'online')
RETURNS void AS $$
BEGIN
  INSERT INTO public.user_presence (user_id, status, last_seen_at, updated_at)
  VALUES (auth.uid(), p_status, now(), now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    status = p_status,
    last_seen_at = now(),
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread count for a user across all conversations
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
    FROM conversation_participants cp
    LEFT JOIN messages m ON m.conversation_id = cp.conversation_id
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

-- =============================================================================
-- 8. ENABLE REALTIME FOR NEW TABLES
-- =============================================================================

-- Enable realtime for typing indicators
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'typing_indicators'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_indicators;
    RAISE NOTICE '✅ Added typing_indicators to realtime publication';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not add typing_indicators to realtime (might already exist or publication missing)';
END $$;

-- Enable realtime for user_presence
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'user_presence'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;
    RAISE NOTICE '✅ Added user_presence to realtime publication';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not add user_presence to realtime (might already exist or publication missing)';
END $$;

-- =============================================================================
-- 9. ADD ADDITIONAL INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_messages_not_deleted ON messages(conversation_id, created_at) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_messages_sender_conversation ON messages(sender_id, conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC NULLS LAST);

SELECT '✅ Messaging schema migration complete!' as status;
