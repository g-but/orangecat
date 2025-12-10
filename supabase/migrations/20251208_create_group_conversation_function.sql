-- =====================================================
-- CREATE GROUP CONVERSATION FUNCTION
-- Creates a conversation and adds multiple participants
-- in a single SECURITY DEFINER function to bypass RLS
-- while enforcing necessary checks.
--
-- Created: 2025-12-08
-- =====================================================

CREATE OR REPLACE FUNCTION create_group_conversation(
  p_created_by uuid,
  p_participant_ids uuid[],
  p_title text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conversation_id uuid;
  v_all_participants uuid[];
  v_distinct_participants uuid[];
BEGIN
  -- Basic validation
  IF p_created_by IS NULL THEN
    RAISE EXCEPTION 'created_by cannot be null';
  END IF;

  IF p_participant_ids IS NULL OR array_length(p_participant_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'participant_ids cannot be empty';
  END IF;

  -- Compose full participant list including creator
  v_all_participants := array_cat(ARRAY[p_created_by], p_participant_ids);

  -- Remove duplicates
  SELECT ARRAY(SELECT DISTINCT unnest(v_all_participants)) INTO v_distinct_participants;

  -- Create conversation
  INSERT INTO conversations (created_by, is_group, title)
  VALUES (p_created_by, true, p_title)
  RETURNING id INTO v_conversation_id;

  -- Add participants (creator as admin, others as member)
  INSERT INTO conversation_participants (conversation_id, user_id, role)
  SELECT v_conversation_id,
         uid,
         CASE WHEN uid = p_created_by THEN 'admin' ELSE 'member' END
  FROM unnest(v_distinct_participants) AS uid;

  RETURN v_conversation_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_group_conversation(uuid, uuid[], text) TO authenticated;

