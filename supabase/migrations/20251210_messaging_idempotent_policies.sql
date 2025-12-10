-- Ensure messaging policies exist (idempotent guards)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can view conversations they participate in' AND tablename = 'conversations'
  ) THEN
    EXECUTE $policy$
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
    $policy$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can create conversations' AND tablename = 'conversations'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can create conversations"
      ON conversations FOR INSERT
      WITH CHECK (auth.uid() = created_by);
    $policy$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Conversation participants can update conversations' AND tablename = 'conversations'
  ) THEN
    EXECUTE $policy$
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
    $policy$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can view conversation participants' AND tablename = 'conversation_participants'
  ) THEN
    EXECUTE $policy$
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
    $policy$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can join conversations' AND tablename = 'conversation_participants'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can join conversations"
      ON conversation_participants FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    $policy$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own participation' AND tablename = 'conversation_participants'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can update their own participation"
      ON conversation_participants FOR UPDATE
      USING (auth.uid() = user_id);
    $policy$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Conversation participants can view messages' AND tablename = 'messages'
  ) THEN
    EXECUTE $policy$
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
    $policy$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Conversation participants can send messages' AND tablename = 'messages'
  ) THEN
    EXECUTE $policy$
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
    $policy$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Message senders can update their messages' AND tablename = 'messages'
  ) THEN
    EXECUTE $policy$
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
    $policy$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Conversation participants can view read receipts' AND tablename = 'message_read_receipts'
  ) THEN
    EXECUTE $policy$
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
    $policy$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can create read receipts for themselves' AND tablename = 'message_read_receipts'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can create read receipts for themselves"
      ON message_read_receipts FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    $policy$;
  END IF;
END
$$ LANGUAGE plpgsql;
