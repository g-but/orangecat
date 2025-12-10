-- Create or replace open_conversation helper
-- Idempotently opens a conversation for the requestor with the provided participants.
-- - Self: returns existing self DM or creates a new one
-- - Direct: returns existing DM between the two users or creates one
-- - Group: always creates a new group conversation

CREATE OR REPLACE FUNCTION open_conversation(
  p_requestor_id uuid,
  p_participant_ids uuid[] DEFAULT ARRAY[]::uuid[],
  p_title text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_all_participants uuid[];
  v_count int;
  v_other uuid;
  v_conversation_id uuid;
BEGIN
  -- normalize input: unique participants and always include requestor
  v_all_participants := (SELECT ARRAY(SELECT DISTINCT x FROM unnest(array_cat(p_participant_ids, ARRAY[p_requestor_id])) AS x));
  v_count := array_length(v_all_participants, 1);

  IF v_count IS NULL OR v_count = 0 THEN
    v_all_participants := ARRAY[p_requestor_id];
    v_count := 1;
  END IF;

  -- Self DM: try find existing conversation with exactly 1 active participant (the requestor)
  IF v_count = 1 THEN
    SELECT c.id INTO v_conversation_id
    FROM conversations c
    JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.is_active = true
    WHERE c.is_group = false
    GROUP BY c.id
    HAVING COUNT(*) = 1 AND MIN(cp.user_id) = p_requestor_id AND MAX(cp.user_id) = p_requestor_id
    LIMIT 1;

    IF v_conversation_id IS NOT NULL THEN
      RETURN v_conversation_id;
    END IF;

    -- create new self conversation
    INSERT INTO conversations (created_by, is_group, title)
    VALUES (p_requestor_id, false, NULL)
    RETURNING id INTO v_conversation_id;

    INSERT INTO conversation_participants (conversation_id, user_id, role)
    VALUES (v_conversation_id, p_requestor_id, 'member');

    RETURN v_conversation_id;
  END IF;

  -- Direct DM: two unique participants
  IF v_count = 2 THEN
    -- determine the other participant
    v_other := (SELECT x FROM unnest(v_all_participants) x WHERE x <> p_requestor_id LIMIT 1);

    SELECT c.id INTO v_conversation_id
    FROM conversations c
    JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.is_active = true
    WHERE c.is_group = false
    GROUP BY c.id
    HAVING COUNT(*) = 2
       AND SUM(CASE WHEN cp.user_id = p_requestor_id THEN 1 ELSE 0 END) = 1
       AND SUM(CASE WHEN cp.user_id = v_other THEN 1 ELSE 0 END) = 1
    LIMIT 1;

    IF v_conversation_id IS NOT NULL THEN
      RETURN v_conversation_id;
    END IF;

    -- create new direct conversation
    INSERT INTO conversations (created_by, is_group, title)
    VALUES (p_requestor_id, false, NULL)
    RETURNING id INTO v_conversation_id;

    INSERT INTO conversation_participants (conversation_id, user_id, role)
    SELECT v_conversation_id, x, CASE WHEN x = p_requestor_id THEN 'admin' ELSE 'member' END
    FROM unnest(v_all_participants) AS x;

    RETURN v_conversation_id;
  END IF;

  -- Group: always create a new conversation
  INSERT INTO conversations (created_by, is_group, title)
  VALUES (p_requestor_id, true, NULLIF(p_title, ''))
  RETURNING id INTO v_conversation_id;

  INSERT INTO conversation_participants (conversation_id, user_id, role)
  SELECT v_conversation_id, x, CASE WHEN x = p_requestor_id THEN 'admin' ELSE 'member' END
  FROM unnest(v_all_participants) AS x;

  RETURN v_conversation_id;
END;
$$;

GRANT EXECUTE ON FUNCTION open_conversation(uuid, uuid[], text) TO authenticated;

