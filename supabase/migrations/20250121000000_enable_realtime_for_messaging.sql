-- Enable Supabase Realtime for messaging tables
-- This allows real-time subscriptions to work for messages, conversations, and conversation_participants

-- Add messages table to supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Add conversations table to supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- Add conversation_participants table to supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;

-- Note: If the publication doesn't exist, it will be created automatically by Supabase
-- If tables are already in the publication, this will fail gracefully with a notice

