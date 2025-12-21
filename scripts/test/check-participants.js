const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkParticipants() {
  try {
    console.log('Checking participants for conversation...');

    const conversationId = '39084687-d46f-48ca-a577-1fa0c1d4d7e2';
    const maoUserId = 'cec88bc9-557f-452b-92f1-e093092fecd6';

    // Check participants in the specific conversation
    const { data: participants, error: partError } = await supabase
      .from('conversation_participants')
      .select('*')
      .eq('conversation_id', conversationId);

    if (partError) {
      console.error('Error fetching participants:', partError);
      return;
    }

    console.log('All participants in conversation:', participants);

    // Check if mao is active
    const maoParticipant = participants.find(p => p.user_id === maoUserId);
    console.log('Mao participant record:', maoParticipant);
    console.log('Mao is active:', maoParticipant?.is_active);

    // Try the exact query that the API uses
    const { data: apiCheck, error: apiError } = await supabase
      .from('conversation_participants')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('user_id', maoUserId)
      .eq('is_active', true)
      .single();

    console.log('API-style query result:', { data: apiCheck, error: apiError });

  } catch (error) {
    console.error('Check error:', error);
  }
}

checkParticipants();


























