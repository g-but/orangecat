-- AI Conversations System
-- Enables users to chat with AI assistants

-- AI Conversations table
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assistant_id UUID NOT NULL REFERENCES ai_assistants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  total_messages INT DEFAULT 0,
  total_tokens_used INT DEFAULT 0,
  total_cost_sats BIGINT DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Messages table
CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  tokens_used INT DEFAULT 0,
  cost_sats BIGINT DEFAULT 0,
  model_used TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_assistant_id ON ai_conversations(assistant_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_status ON ai_conversations(status);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_last_message ON ai_conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_created_at ON ai_messages(created_at);

-- Enable RLS
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_conversations

-- Users can view their own conversations
CREATE POLICY "Users can view own conversations"
  ON ai_conversations
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can create conversations
CREATE POLICY "Users can create conversations"
  ON ai_conversations
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own conversations (archive, title change)
CREATE POLICY "Users can update own conversations"
  ON ai_conversations
  FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own conversations
CREATE POLICY "Users can delete own conversations"
  ON ai_conversations
  FOR DELETE
  USING (user_id = auth.uid());

-- Assistant owners can view conversations with their assistants (for analytics)
CREATE POLICY "Assistant owners can view conversations"
  ON ai_conversations
  FOR SELECT
  USING (
    assistant_id IN (
      SELECT id FROM ai_assistants WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for ai_messages

-- Users can view messages in their conversations
CREATE POLICY "Users can view messages in own conversations"
  ON ai_messages
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM ai_conversations WHERE user_id = auth.uid()
    )
  );

-- Users can add messages to their conversations
CREATE POLICY "Users can add messages to own conversations"
  ON ai_messages
  FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM ai_conversations WHERE user_id = auth.uid()
    )
  );

-- Assistant owners can view messages for their assistants (for analytics)
CREATE POLICY "Assistant owners can view messages"
  ON ai_messages
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT c.id FROM ai_conversations c
      JOIN ai_assistants a ON c.assistant_id = a.id
      WHERE a.user_id = auth.uid()
    )
  );

-- Function to update conversation stats after message
CREATE OR REPLACE FUNCTION update_ai_conversation_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ai_conversations
  SET
    total_messages = total_messages + 1,
    total_tokens_used = total_tokens_used + COALESCE(NEW.tokens_used, 0),
    total_cost_sats = total_cost_sats + COALESCE(NEW.cost_sats, 0),
    last_message_at = NEW.created_at,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update conversation stats
DROP TRIGGER IF EXISTS trigger_update_ai_conversation_stats ON ai_messages;
CREATE TRIGGER trigger_update_ai_conversation_stats
  AFTER INSERT ON ai_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_conversation_stats();

-- Function to auto-generate conversation title from first message
CREATE OR REPLACE FUNCTION auto_title_ai_conversation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set title if this is the first user message and conversation has no title
  IF NEW.role = 'user' THEN
    UPDATE ai_conversations
    SET title = COALESCE(
      title,
      CASE
        WHEN LENGTH(NEW.content) > 50 THEN SUBSTRING(NEW.content, 1, 47) || '...'
        ELSE NEW.content
      END
    )
    WHERE id = NEW.conversation_id AND title IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-title conversation
DROP TRIGGER IF EXISTS trigger_auto_title_ai_conversation ON ai_messages;
CREATE TRIGGER trigger_auto_title_ai_conversation
  AFTER INSERT ON ai_messages
  FOR EACH ROW
  EXECUTE FUNCTION auto_title_ai_conversation();
