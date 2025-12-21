-- Fix messaging participants for current user (mao)
-- Add mao to all existing conversations where they're missing

-- Get mao's user ID
DO $$
DECLARE
  mao_user_id uuid := 'cec88bc9-557f-452b-92f1-e093092fecd6';
BEGIN
  -- Add mao as participant to all conversations where they're not already a participant
  INSERT INTO conversation_participants (conversation_id, user_id, role, is_active)
  SELECT
    c.id,
    mao_user_id,
    'member',
    true
  FROM conversations c
  WHERE NOT EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = c.id
    AND cp.user_id = mao_user_id
  );

  RAISE NOTICE 'Added mao as participant to % conversations', (SELECT COUNT(*) FROM conversation_participants WHERE user_id = mao_user_id);
END $$;


























