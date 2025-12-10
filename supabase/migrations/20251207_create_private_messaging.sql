-- =====================================================
-- PRIVATE MESSAGING SYSTEM
-- Creates tables and functionality for private messaging between users
--
-- Created: 2025-12-07
-- Last Modified: 2025-12-07
-- Last Modified Summary: Initial private messaging system
-- =====================================================

-- 1. Conversations table (main conversation threads)
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text, -- Optional title for group conversations
  is_group boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  last_message_at timestamptz DEFAULT now() NOT NULL,
  last_message_preview text, -- Preview of the last message
  last_message_sender_id uuid REFERENCES profiles(id) ON DELETE SET NULL
);

-- 2. Conversation participants (who is in each conversation)
CREATE TABLE IF NOT EXISTS conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member', -- member, admin
  joined_at timestamptz DEFAULT now() NOT NULL,
  last_read_at timestamptz DEFAULT now() NOT NULL,
  is_active boolean NOT NULL DEFAULT true,

  UNIQUE(conversation_id, user_id)
);

-- 3. Messages table (individual messages)
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  message_type text NOT NULL DEFAULT 'text', -- text, image, file, system
  metadata jsonb, -- For additional data like file attachments, etc.
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  is_deleted boolean NOT NULL DEFAULT false,
  edited_at timestamptz
);

-- 4. Message read receipts (optional - for showing read status)
CREATE TABLE IF NOT EXISTS message_read_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  read_at timestamptz DEFAULT now() NOT NULL,

  UNIQUE(message_id, user_id)
);

-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_active ON conversation_participants(user_id, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created_at ON messages(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_message_read_receipts_message_id ON message_read_receipts(message_id);
CREATE INDEX IF NOT EXISTS idx_message_read_receipts_user_id ON message_read_receipts(user_id);

-- 6. Enable RLS on all tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_receipts ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies

-- Conversations: Users can see conversations they're participating in
CREATE POLICY "Users can view conversations they participate in"
  ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversations.id
      AND cp.user_id = auth.uid()
      AND cp.is_active = true
    )
  );

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Conversation participants can update conversations"
  ON conversations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversations.id
      AND cp.user_id = auth.uid()
      AND cp.is_active = true
    )
  );

-- Conversation participants: Users can manage their own participation
CREATE POLICY "Users can view conversation participants"
  ON conversation_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.user_id = auth.uid()
      AND cp.is_active = true
    )
  );

CREATE POLICY "Users can join conversations"
  ON conversation_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation"
  ON conversation_participants FOR UPDATE
  USING (auth.uid() = user_id);

-- Messages: Participants can see messages in their conversations
CREATE POLICY "Conversation participants can view messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id
      AND cp.user_id = auth.uid()
      AND cp.is_active = true
    )
  );

CREATE POLICY "Conversation participants can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id
      AND cp.user_id = auth.uid()
      AND cp.is_active = true
    )
  );

CREATE POLICY "Message senders can update their messages"
  ON messages FOR UPDATE
  USING (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id
      AND cp.user_id = auth.uid()
      AND cp.is_active = true
    )
  );

-- Message read receipts: Participants can manage their own read status
CREATE POLICY "Conversation participants can view read receipts"
  ON message_read_receipts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = (
        SELECT m.conversation_id FROM messages m WHERE m.id = message_read_receipts.message_id
      )
      AND cp.user_id = auth.uid()
      AND cp.is_active = true
    )
  );

CREATE POLICY "Users can create read receipts for themselves"
  ON message_read_receipts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 8. Functions for messaging

-- Function to create a conversation between two users
CREATE OR REPLACE FUNCTION create_direct_conversation(participant1_id uuid, participant2_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  conversation_id uuid;
  existing_conversation_id uuid;
BEGIN
  -- Check if a direct conversation already exists between these users
  SELECT c.id INTO existing_conversation_id
  FROM conversations c
  JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
  JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
  WHERE c.is_group = false
    AND cp1.user_id = participant1_id
    AND cp2.user_id = participant2_id
    AND cp1.is_active = true
    AND cp2.is_active = true;

  -- If exists, return the existing conversation
  IF existing_conversation_id IS NOT NULL THEN
    RETURN existing_conversation_id;
  END IF;

  -- Create new conversation
  INSERT INTO conversations (created_by, is_group)
  VALUES (participant1_id, false)
  RETURNING id INTO conversation_id;

  -- Add participants
  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES (conversation_id, participant1_id), (conversation_id, participant2_id);

  RETURN conversation_id;
END;
$$;

-- Function to send a message and update conversation metadata
CREATE OR REPLACE FUNCTION send_message(
  p_conversation_id uuid,
  p_sender_id uuid,
  p_content text,
  p_message_type text DEFAULT 'text',
  p_metadata jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  message_id uuid;
BEGIN
  -- Verify sender is a participant
  IF NOT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = p_conversation_id
    AND user_id = p_sender_id
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'User is not a participant in this conversation';
  END IF;

  -- Insert message
  INSERT INTO messages (conversation_id, sender_id, content, message_type, metadata)
  VALUES (p_conversation_id, p_sender_id, p_content, p_message_type, p_metadata)
  RETURNING id INTO message_id;

  -- Update conversation metadata
  UPDATE conversations
  SET
    last_message_at = now(),
    last_message_preview = LEFT(p_content, 100),
    last_message_sender_id = p_sender_id,
    updated_at = now()
  WHERE id = p_conversation_id;

  -- Update participant's last_read_at for sender
  UPDATE conversation_participants
  SET last_read_at = now()
  WHERE conversation_id = p_conversation_id
    AND user_id = p_sender_id;

  RETURN message_id;
END;
$$;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_conversation_read(p_conversation_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify user is a participant
  IF NOT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = p_conversation_id
    AND user_id = p_user_id
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'User is not a participant in this conversation';
  END IF;

  -- Mark all unread messages as read
  INSERT INTO message_read_receipts (message_id, user_id)
  SELECT m.id, p_user_id
  FROM messages m
  WHERE m.conversation_id = p_conversation_id
    AND m.created_at > (
      SELECT last_read_at
      FROM conversation_participants
      WHERE conversation_id = p_conversation_id AND user_id = p_user_id
    )
  ON CONFLICT (message_id, user_id) DO NOTHING;

  -- Update participant's last_read_at
  UPDATE conversation_participants
  SET last_read_at = now()
  WHERE conversation_id = p_conversation_id AND user_id = p_user_id;
END;
$$;

-- 9. Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_message_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  IF TG_OP = 'UPDATE' THEN
    NEW.edited_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_conversations_updated_at ON conversations;
CREATE TRIGGER trigger_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

DROP TRIGGER IF EXISTS trigger_messages_updated_at ON messages;
CREATE TRIGGER trigger_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_message_timestamp();

-- 10. Views for easier querying

-- View for conversations with participant info
CREATE OR REPLACE VIEW conversation_details AS
SELECT
  c.*,
  json_agg(
    json_build_object(
      'user_id', p.id,
      'username', p.username,
      'name', p.name,
      'avatar_url', p.avatar_url,
      'role', cp.role,
      'joined_at', cp.joined_at,
      'last_read_at', cp.last_read_at,
      'is_active', cp.is_active
    )
  ) as participants,
  (
    SELECT COUNT(*)
    FROM messages m
    WHERE m.conversation_id = c.id
      AND m.created_at > cp.last_read_at
  ) as unread_count
FROM conversations c
JOIN conversation_participants cp ON c.id = cp.conversation_id
JOIN profiles p ON cp.user_id = p.id
WHERE cp.is_active = true
GROUP BY c.id, cp.last_read_at;

-- View for messages with sender info
CREATE OR REPLACE VIEW message_details AS
SELECT
  m.*,
  json_build_object(
    'id', p.id,
    'username', p.username,
    'name', p.name,
    'avatar_url', p.avatar_url
  ) as sender,
  CASE WHEN mrr.user_id IS NOT NULL THEN true ELSE false END as is_read
FROM messages m
JOIN profiles p ON m.sender_id = p.id
LEFT JOIN message_read_receipts mrr ON m.id = mrr.message_id AND mrr.user_id = auth.uid()
WHERE m.is_deleted = false;










