-- Add critical indexes for messaging system performance
-- These indexes optimize the most common query patterns

-- 1. Optimize unread count queries (most common operation)
-- This allows fast lookup of unread messages per conversation
CREATE INDEX IF NOT EXISTS idx_messages_unread 
ON messages(conversation_id, created_at DESC)
WHERE is_deleted = false;

-- 2. Optimize active participant lookups (most common query)
-- Used in every conversation access check
CREATE INDEX IF NOT EXISTS idx_conversation_participants_active
ON conversation_participants(conversation_id, user_id, is_active)
WHERE is_active = true;

-- 3. Optimize conversation list sorting (sorted by last_message_at)
-- Used when displaying conversation list
CREATE INDEX IF NOT EXISTS idx_conversations_last_message
ON conversations(last_message_at DESC NULLS LAST)
WHERE last_message_at IS NOT NULL;

-- 4. Optimize read receipts queries
-- Used for checking message read status
CREATE INDEX IF NOT EXISTS idx_message_read_receipts_message_user
ON message_read_receipts(message_id, user_id);

-- 5. Composite index for participant + conversation lookups
-- Used when checking if user is participant
CREATE INDEX IF NOT EXISTS idx_participants_user_conversation
ON conversation_participants(user_id, conversation_id, is_active)
WHERE is_active = true;

-- 6. Partial index for active messages only (reduces index size)
-- Most queries filter by is_deleted = false
CREATE INDEX IF NOT EXISTS idx_messages_active
ON messages(conversation_id, created_at DESC)
WHERE is_deleted = false;

-- 7. Index for sender lookups (for message details)
CREATE INDEX IF NOT EXISTS idx_messages_sender_conversation
ON messages(sender_id, conversation_id, created_at DESC)
WHERE is_deleted = false;

-- 8. Full-text search index for message content search
-- Enables fast message search within conversations
CREATE INDEX IF NOT EXISTS idx_messages_content_search 
ON messages USING gin(to_tsvector('english', content))
WHERE is_deleted = false;

-- Add comment explaining the indexes
COMMENT ON INDEX idx_messages_unread IS 'Optimizes unread count queries per conversation';
COMMENT ON INDEX idx_conversation_participants_active IS 'Fast lookup of active participants';
COMMENT ON INDEX idx_conversations_last_message IS 'Optimizes conversation list sorting';
COMMENT ON INDEX idx_message_read_receipts_message_user IS 'Fast read receipt lookups';
COMMENT ON INDEX idx_participants_user_conversation IS 'Optimizes participant membership checks';
COMMENT ON INDEX idx_messages_active IS 'Partial index for non-deleted messages only';
COMMENT ON INDEX idx_messages_sender_conversation IS 'Optimizes sender-based message queries';
COMMENT ON INDEX idx_messages_content_search IS 'Full-text search for message content';

