#!/usr/bin/env node

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createMessagingFunctions() {
  console.log('🔧 Creating messaging functions...\n');

  try {
    // Create create_direct_conversation function
    console.log('1. Creating create_direct_conversation function...');
    const createDirectConversationSQL = `
CREATE OR REPLACE FUNCTION create_direct_conversation(participant1_id uuid, participant2_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  conversation_id uuid;
  existing_conversation_id uuid;
BEGIN
  -- Check if a direct conversation already exists between these users
  SELECT c.id INTO existing_conversation_id
  FROM conversations c
  JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
  JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
  WHERE c.is_group = false
    AND cp1.user_id = participant1_id
    AND cp2.user_id = participant2_id
    AND cp1.is_active = true
    AND cp2.is_active = true;

  -- If exists, return the existing conversation
  IF existing_conversation_id IS NOT NULL THEN
    RETURN existing_conversation_id;
  END IF;

  -- Create new conversation
  INSERT INTO conversations (created_by, is_group)
  VALUES (participant1_id, false)
  RETURNING id INTO conversation_id;

  -- Add participants
  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES (conversation_id, participant1_id), (conversation_id, participant2_id);

  RETURN conversation_id;
END;
$$;
`;

    const { error: createDirectError } = await supabase.rpc('exec_sql', { query: createDirectConversationSQL });
    if (createDirectError) {
      console.error('❌ Failed to create create_direct_conversation function:', createDirectError);
    } else {
      console.log('✅ create_direct_conversation function created');
    }

    // Create send_message function
    console.log('2. Creating send_message function...');
    const sendMessageSQL = `
CREATE OR REPLACE FUNCTION send_message(
  p_conversation_id uuid,
  p_sender_id uuid,
  p_content text,
  p_message_type text DEFAULT 'text',
  p_metadata jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  message_id uuid;
BEGIN
  -- Verify sender is a participant
  IF NOT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = p_conversation_id
    AND user_id = p_sender_id
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'User is not a participant in this conversation';
  END IF;

  -- Insert message
  INSERT INTO messages (conversation_id, sender_id, content, message_type, metadata)
  VALUES (p_conversation_id, p_sender_id, p_content, p_message_type, p_metadata)
  RETURNING id INTO message_id;

  -- Update conversation metadata
  UPDATE conversations
  SET
    last_message_at = now(),
    last_message_preview = LEFT(p_content, 100),
    last_message_sender_id = p_sender_id,
    updated_at = now()
  WHERE id = p_conversation_id;

  -- Update participant's last_read_at for sender
  UPDATE conversation_participants
  SET last_read_at = now()
  WHERE conversation_id = p_conversation_id
    AND user_id = p_sender_id;

  RETURN message_id;
END;
$$;
`;

    const { error: sendMessageError } = await supabase.rpc('exec_sql', { query: sendMessageSQL });
    if (sendMessageError) {
      console.error('❌ Failed to create send_message function:', sendMessageError);
    } else {
      console.log('✅ send_message function created');
    }

    // Create get_user_conversations function
    console.log('3. Creating get_user_conversations function...');
    const getUserConversationsSQL = `
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
          'role', cp.role,
          'joined_at', cp.joined_at,
          'last_read_at', cp.last_read_at,
          'is_active', cp.is_active
        )
      )
      FROM conversation_participants cp
      JOIN profiles p ON cp.user_id = p.id
      WHERE cp.conversation_id = c.id
      AND cp.is_active = true
    ) as participants,
    (
      SELECT COUNT(*)
      FROM messages m
      WHERE m.conversation_id = c.id
        AND m.created_at > (
          SELECT last_read_at
          FROM conversation_participants
          WHERE conversation_id = c.id AND user_id = p_user_id
        )
    ) as unread_count
  FROM conversations c
  JOIN conversation_participants cp ON c.id = cp.conversation_id
  WHERE cp.user_id = p_user_id
    AND cp.is_active = true
  GROUP BY c.id, cp.last_read_at
  ORDER BY c.last_message_at DESC;
END;
$$;
`;

    const { error: getUserConversationsError } = await supabase.rpc('exec_sql', { query: getUserConversationsSQL });
    if (getUserConversationsError) {
      console.error('❌ Failed to create get_user_conversations function:', getUserConversationsError);
    } else {
      console.log('✅ get_user_conversations function created');
    }

    console.log('\n🎉 Messaging functions created successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createMessagingFunctions();


























