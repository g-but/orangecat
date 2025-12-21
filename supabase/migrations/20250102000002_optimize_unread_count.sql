-- Optimize unread count calculation with a single SQL function
-- This replaces N queries with 1 query for much better performance

CREATE OR REPLACE FUNCTION get_unread_counts(p_user_id uuid)
RETURNS TABLE (conversation_id uuid, unread_count bigint) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.conversation_id,
    COUNT(m.id)::bigint as unread_count
  FROM conversation_participants cp
  LEFT JOIN messages m ON 
    m.conversation_id = cp.conversation_id
    AND m.sender_id != p_user_id
    AND m.is_deleted = false
    AND (
      -- If user has never read, all messages are unread
      cp.last_read_at IS NULL 
      OR 
      -- Otherwise, messages after last_read_at are unread
      m.created_at > cp.last_read_at
    )
  WHERE cp.user_id = p_user_id
    AND cp.is_active = true
  GROUP BY cp.conversation_id;
END;
$$;

-- Function to get total unread count across all conversations
CREATE OR REPLACE FUNCTION get_total_unread_count(p_user_id uuid)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_count bigint;
BEGIN
  SELECT COUNT(m.id)::bigint INTO total_count
  FROM conversation_participants cp
  LEFT JOIN messages m ON 
    m.conversation_id = cp.conversation_id
    AND m.sender_id != p_user_id
    AND m.is_deleted = false
    AND (
      cp.last_read_at IS NULL 
      OR 
      m.created_at > cp.last_read_at
    )
  WHERE cp.user_id = p_user_id
    AND cp.is_active = true;
  
  RETURN COALESCE(total_count, 0);
END;
$$;

-- Add comments
COMMENT ON FUNCTION get_unread_counts(uuid) IS 'Returns unread message count per conversation for a user. Optimized single-query approach.';
COMMENT ON FUNCTION get_total_unread_count(uuid) IS 'Returns total unread message count across all conversations for a user.';

