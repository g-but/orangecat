-- =============================================
-- ADD ACTOR-BASED MESSAGING
--
-- Enables sending messages as different actors:
-- - Personal (your own actor)
-- - Organization (if you're a member with messaging permission)
-- - System (OrangeCat for announcements)
--
-- Also enables:
-- - Self-messaging (notes to self)
-- - Group conversations with actor participants
-- =============================================

-- Step 1: Add actor_id to conversation_participants
-- This allows actors (not just users) to be in conversations
ALTER TABLE conversation_participants
ADD COLUMN IF NOT EXISTS actor_id uuid REFERENCES actors(id) ON DELETE CASCADE;

-- Step 2: Add sender_actor_id to messages
-- This tracks which actor sent the message (personal vs org)
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS sender_actor_id uuid REFERENCES actors(id) ON DELETE SET NULL;

-- Step 3: Add message_type for system messages
-- Expand the check constraint to include 'system' type
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_message_type_check;
ALTER TABLE messages ADD CONSTRAINT messages_message_type_check
  CHECK (message_type IN ('text', 'image', 'file', 'system'));

-- Step 4: Add is_self_conversation flag for notes to self
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS is_self_conversation boolean DEFAULT false;

-- Step 5: Create indexes
CREATE INDEX IF NOT EXISTS idx_conversation_participants_actor ON conversation_participants(actor_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_actor ON messages(sender_actor_id);

-- Step 6: Backfill actor_id for existing conversation participants
-- Match user_id to their personal actor
UPDATE conversation_participants cp
SET actor_id = (
  SELECT a.id
  FROM actors a
  WHERE a.user_id = cp.user_id AND a.actor_type = 'user'
  LIMIT 1
)
WHERE cp.actor_id IS NULL AND cp.user_id IS NOT NULL;

-- Step 7: Backfill sender_actor_id for existing messages
UPDATE messages m
SET sender_actor_id = (
  SELECT a.id
  FROM actors a
  WHERE a.user_id = m.sender_id AND a.actor_type = 'user'
  LIMIT 1
)
WHERE m.sender_actor_id IS NULL AND m.sender_id IS NOT NULL;

-- Step 8: Update RLS policies to support actor-based access

-- Users can view conversations where their actor is a participant
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
CREATE POLICY "Users can view their conversations" ON conversations
  FOR SELECT USING (
    id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid()
         OR actor_id IN (
           SELECT id FROM actors WHERE user_id = auth.uid()
           UNION
           SELECT a.id FROM actors a
           JOIN group_members gm ON a.group_id = gm.group_id
           WHERE gm.user_id = auth.uid()
         )
    )
  );

-- Users can view messages in conversations they have access to
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid()
         OR actor_id IN (
           SELECT id FROM actors WHERE user_id = auth.uid()
           UNION
           SELECT a.id FROM actors a
           JOIN group_members gm ON a.group_id = gm.group_id
           WHERE gm.user_id = auth.uid()
         )
    )
  );

-- Users can send messages as their personal actor or group actors they belong to
DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (
    -- Must be sender (user_id) or have access to sender_actor_id
    sender_id = auth.uid()
    OR sender_actor_id IN (
      SELECT id FROM actors WHERE user_id = auth.uid()
      UNION
      SELECT a.id FROM actors a
      JOIN group_members gm ON a.group_id = gm.group_id
      WHERE gm.user_id = auth.uid() AND gm.role IN ('founder', 'admin', 'moderator')
    )
  );

-- Step 9: Function to get user's available actors for messaging
CREATE OR REPLACE FUNCTION get_messaging_actors(p_user_id uuid)
RETURNS TABLE (
  actor_id uuid,
  actor_type text,
  display_name text,
  avatar_url text,
  is_personal boolean
) AS $$
BEGIN
  RETURN QUERY
  -- Personal actor
  SELECT
    a.id,
    a.actor_type,
    a.display_name,
    a.avatar_url,
    true as is_personal
  FROM actors a
  WHERE a.user_id = p_user_id AND a.actor_type = 'user'

  UNION ALL

  -- Group actors (where user is admin/moderator)
  SELECT
    a.id,
    a.actor_type,
    a.display_name,
    a.avatar_url,
    false as is_personal
  FROM actors a
  JOIN group_members gm ON a.group_id = gm.group_id
  WHERE gm.user_id = p_user_id
    AND gm.role IN ('founder', 'admin', 'moderator')
    AND a.actor_type = 'group';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Function to start/find conversation with actor
CREATE OR REPLACE FUNCTION find_or_create_conversation(
  p_participant_actor_ids uuid[],
  p_title text DEFAULT NULL,
  p_is_self boolean DEFAULT false
) RETURNS uuid AS $$
DECLARE
  v_conversation_id uuid;
  v_participant_count int;
  v_actor_id uuid;
BEGIN
  v_participant_count := array_length(p_participant_actor_ids, 1);

  -- For direct (2 participants) or self conversations, try to find existing
  IF v_participant_count <= 2 THEN
    SELECT c.id INTO v_conversation_id
    FROM conversations c
    WHERE (
      -- Self conversation
      (p_is_self AND c.is_self_conversation = true AND EXISTS (
        SELECT 1 FROM conversation_participants cp
        WHERE cp.conversation_id = c.id
          AND cp.actor_id = p_participant_actor_ids[1]
      ))
      OR
      -- Direct conversation between two actors
      (NOT p_is_self AND c.conversation_type = 'direct' AND (
        SELECT COUNT(DISTINCT cp.actor_id)
        FROM conversation_participants cp
        WHERE cp.conversation_id = c.id
          AND cp.actor_id = ANY(p_participant_actor_ids)
      ) = v_participant_count)
    )
    LIMIT 1;

    IF v_conversation_id IS NOT NULL THEN
      RETURN v_conversation_id;
    END IF;
  END IF;

  -- Create new conversation
  INSERT INTO conversations (
    conversation_type,
    title,
    is_self_conversation,
    created_at
  ) VALUES (
    CASE WHEN v_participant_count > 2 THEN 'group' ELSE 'direct' END,
    p_title,
    p_is_self,
    now()
  ) RETURNING id INTO v_conversation_id;

  -- Add participants
  FOREACH v_actor_id IN ARRAY p_participant_actor_ids
  LOOP
    INSERT INTO conversation_participants (conversation_id, actor_id, user_id)
    SELECT
      v_conversation_id,
      v_actor_id,
      a.user_id
    FROM actors a
    WHERE a.id = v_actor_id;
  END LOOP;

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 11: Function to send message as actor
CREATE OR REPLACE FUNCTION send_message_as_actor(
  p_conversation_id uuid,
  p_sender_actor_id uuid,
  p_content text,
  p_message_type text DEFAULT 'text',
  p_metadata jsonb DEFAULT '{}'
) RETURNS uuid AS $$
DECLARE
  v_message_id uuid;
  v_sender_user_id uuid;
BEGIN
  -- Get user_id from actor (for backward compatibility)
  SELECT user_id INTO v_sender_user_id
  FROM actors
  WHERE id = p_sender_actor_id;

  -- Insert message
  INSERT INTO messages (
    conversation_id,
    sender_id,
    sender_actor_id,
    content,
    message_type,
    metadata
  ) VALUES (
    p_conversation_id,
    COALESCE(v_sender_user_id, auth.uid()),
    p_sender_actor_id,
    p_content,
    p_message_type,
    p_metadata
  ) RETURNING id INTO v_message_id;

  -- Update conversation last_message_at
  UPDATE conversations
  SET last_message_at = now(), updated_at = now()
  WHERE id = p_conversation_id;

  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 12: Function to send system message from OrangeCat
CREATE OR REPLACE FUNCTION send_orangecat_message(
  p_recipient_user_id uuid,
  p_content text,
  p_metadata jsonb DEFAULT '{}'
) RETURNS uuid AS $$
DECLARE
  v_orangecat_actor_id uuid := '00000000-0000-0000-0000-000000000001';
  v_recipient_actor_id uuid;
  v_conversation_id uuid;
  v_message_id uuid;
BEGIN
  -- Get recipient's personal actor
  SELECT id INTO v_recipient_actor_id
  FROM actors
  WHERE user_id = p_recipient_user_id AND actor_type = 'user'
  LIMIT 1;

  IF v_recipient_actor_id IS NULL THEN
    RAISE EXCEPTION 'Recipient actor not found';
  END IF;

  -- Find or create conversation with OrangeCat
  v_conversation_id := find_or_create_conversation(
    ARRAY[v_orangecat_actor_id, v_recipient_actor_id],
    'OrangeCat'
  );

  -- Send message
  v_message_id := send_message_as_actor(
    v_conversation_id,
    v_orangecat_actor_id,
    p_content,
    'system',
    p_metadata
  );

  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 13: Trigger to send welcome message to new users
CREATE OR REPLACE FUNCTION send_welcome_message() RETURNS TRIGGER AS $$
BEGIN
  -- Wait a moment for actor to be created, then send welcome
  PERFORM send_orangecat_message(
    NEW.id,
    E'Welcome to OrangeCat! 🐱\n\nI''m here to help you get started. Here are some things you can do:\n\n• Create a project and start raising funds\n• List your products or services\n• Connect with the community\n• Explore interesting projects to support\n\nIf you have any questions, just send me a message!',
    '{"type": "welcome"}'::jsonb
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail user creation if welcome message fails
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Welcome message trigger should be added after actors are auto-created for new users
-- This is typically handled in application code after user signup
