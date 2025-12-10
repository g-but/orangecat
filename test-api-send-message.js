const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAPISendMessage() {
  try {
    console.log('Testing API send message...');

    // Get mao's user ID
    const { data: maoUser } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('username', 'mao')
      .single();

    console.log('Mao user:', maoUser);

    // Use the same conversation ID from before
    const conversationId = '39084687-d46f-48ca-a577-1fa0c1d4d7e2';

    // Test the send_message RPC function directly
    console.log('Testing send_message RPC...');
    const { data: messageId, error: rpcError } = await supabase
      .rpc('send_message', {
        p_conversation_id: conversationId,
        p_sender_id: maoUser.id,
        p_content: 'API test message from script',
        p_message_type: 'text'
      });

    if (rpcError) {
      console.error('RPC Error:', rpcError);
    } else {
      console.log('RPC Success! Message ID:', messageId);

      // Fetch the message to confirm
      const { data: message, error: fetchError } = await supabase
        .from('message_details')
        .select('*')
        .eq('id', messageId)
        .single();

      if (fetchError) {
        console.error('Fetch error:', fetchError);
      } else {
        console.log('Message created:', message);
      }
    }

  } catch (error) {
    console.error('Test error:', error);
  }
}

testAPISendMessage();








