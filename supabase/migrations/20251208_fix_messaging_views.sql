-- =====================================================
-- FIX MESSAGING VIEWS
-- Fixes the conversation_details and message_details views
-- to properly handle per-user data
--
-- Created: 2025-12-08
-- Issue: conversation_details was grouping incorrectly, causing
--        duplicate rows and wrong unread counts
-- =====================================================

-- Drop existing views
DROP VIEW IF EXISTS conversation_details;
DROP VIEW IF EXISTS message_details;

-- Recreate conversation_details as a function that takes user_id
-- This ensures proper per-user filtering
CREATE OR REPLACE FUNCTION get_user_conversations(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  is_group boolean,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz,
  last_message_at timestamptz,
  last_message_preview text,
  last_message_sender_id uuid,
  participants jsonb,
  unread_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
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
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'user_id', p.id,
          'username', p.username,
          'name', p.name,
          'avatar_url', p.avatar_url,
          'role', cp2.role,
          'joined_at', cp2.joined_at,
          'last_read_at', cp2.last_read_at,
          'is_active', cp2.is_active
        )
      )
      FROM conversation_participants cp2
      JOIN profiles p ON cp2.user_id = p.id
      WHERE cp2.conversation_id = c.id AND cp2.is_active = true
    ) as participants,
    (
      SELECT COUNT(*)
      FROM messages m
      WHERE m.conversation_id = c.id
        AND m.sender_id != p_user_id
        AND m.created_at > cp.last_read_at
        AND m.is_deleted = false
    ) as unread_count
  FROM conversations c
  JOIN conversation_participants cp ON c.id = cp.conversation_id AND cp.user_id = p_user_id
  WHERE cp.is_active = true
  ORDER BY c.last_message_at DESC;
END;
$$;

-- Create a simpler view that uses auth.uid() for RLS-compatible queries
-- This view is for direct queries from the client
CREATE OR REPLACE VIEW conversation_details AS
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
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'user_id', p.id,
        'username', p.username,
        'name', p.name,
        'avatar_url', p.avatar_url,
        'role', cp2.role,
        'joined_at', cp2.joined_at,
        'last_read_at', cp2.last_read_at,
        'is_active', cp2.is_active
      )
    )
    FROM conversation_participants cp2
    JOIN profiles p ON cp2.user_id = p.id
    WHERE cp2.conversation_id = c.id AND cp2.is_active = true
  ) as participants,
  (
    SELECT COUNT(*)
    FROM messages m
    WHERE m.conversation_id = c.id
      AND m.sender_id != auth.uid()
      AND m.created_at > (
        SELECT last_read_at
        FROM conversation_participants
        WHERE conversation_id = c.id AND user_id = auth.uid()
      )
      AND m.is_deleted = false
  ) as unread_count
FROM conversations c
WHERE EXISTS (
  SELECT 1 FROM conversation_participants cp
  WHERE cp.conversation_id = c.id
    AND cp.user_id = auth.uid()
    AND cp.is_active = true
);

-- Recreate message_details view with proper read status
CREATE OR REPLACE VIEW message_details AS
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
    'username', p.username,
    'name', p.name,
    'avatar_url', p.avatar_url
  ) as sender,
  CASE
    WHEN m.sender_id = auth.uid() THEN true
    WHEN EXISTS (
      SELECT 1 FROM message_read_receipts mrr
      WHERE mrr.message_id = m.id AND mrr.user_id = auth.uid()
    ) THEN true
    ELSE false
  END as is_read
FROM messages m
JOIN profiles p ON m.sender_id = p.id
WHERE m.is_deleted = false
  AND EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = m.conversation_id
      AND cp.user_id = auth.uid()
      AND cp.is_active = true
  );

-- Add index for faster unread count queries
CREATE INDEX IF NOT EXISTS idx_messages_unread_lookup
  ON messages(conversation_id, sender_id, created_at)
  WHERE is_deleted = false;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION get_user_conversations(uuid) TO authenticated;

-- Add comment for documentation
COMMENT ON VIEW conversation_details IS 'Returns conversations for the current authenticated user with participant info and unread counts';
COMMENT ON VIEW message_details IS 'Returns messages with sender info and read status for the current authenticated user';
COMMENT ON FUNCTION get_user_conversations(uuid) IS 'Returns all conversations for a specific user with proper unread counts';
