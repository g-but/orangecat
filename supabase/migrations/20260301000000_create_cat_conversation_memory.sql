-- Cat Conversation Memory
--
-- Persistent chat history for My Cat AI.
-- One conversation per user (default), with ability to create new ones later.
--
-- Design notes:
-- - Simple: users have a "default" conversation that persists across sessions
-- - Messages store role (user/assistant), content, and optional model metadata
-- - RLS ensures users can only see their own conversations/messages
-- - No foreign key to actors — conversations belong to auth users directly
--   (Cat is always personal, not group-scoped)

-- Conversations table
CREATE TABLE IF NOT EXISTS cat_conversations (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        TEXT,                        -- Auto-generated from first message
  is_default   BOOLEAN NOT NULL DEFAULT true, -- One default conversation per user
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cat_conversations_user_id
  ON cat_conversations(user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cat_conversations_default_per_user
  ON cat_conversations(user_id)
  WHERE is_default = true;

-- Messages table
CREATE TABLE IF NOT EXISTS cat_messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES cat_conversations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content         TEXT NOT NULL,
  model_used      TEXT,     -- Which AI model generated this (assistant messages only)
  provider        TEXT,     -- groq | openrouter
  token_count     INTEGER,  -- Approximate tokens in this message
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cat_messages_conversation_id
  ON cat_messages(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cat_messages_user_id
  ON cat_messages(user_id);

-- RLS policies
ALTER TABLE cat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cat_conversations_select" ON cat_conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "cat_conversations_insert" ON cat_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cat_conversations_update" ON cat_conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "cat_conversations_delete" ON cat_conversations
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "cat_messages_select" ON cat_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "cat_messages_insert" ON cat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- updated_at trigger for conversations
CREATE OR REPLACE FUNCTION update_cat_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE cat_conversations SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cat_messages_update_conversation_timestamp
  AFTER INSERT ON cat_messages
  FOR EACH ROW EXECUTE FUNCTION update_cat_conversation_timestamp();
