const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugUser() {
  try {
    console.log('Debugging user ID...');

    // Get mao's profile
    const { data: maoProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', 'mao')
      .single();

    if (profileError) {
      console.error('Error fetching mao profile:', profileError);
      return;
    }

    console.log('Mao profile:', maoProfile);

    // Check conversation participants for a specific conversation
    const conversationId = '39084687-d46f-48ca-a577-1fa0c1d4d7e2'; // One of the conversations

    const { data: participants, error: partError } = await supabase
      .from('conversation_participants')
      .select('*')
      .eq('conversation_id', conversationId);

    if (partError) {
      console.error('Error fetching participants:', partError);
      return;
    }

    console.log('Participants in conversation:', participants);

    // Check if mao is in the participants
    const maoParticipant = participants.find(p => p.user_id === maoProfile.id);
    console.log('Mao is participant:', !!maoParticipant);

    if (maoParticipant) {
      console.log('Mao participant details:', maoParticipant);
    }

  } catch (error) {
    console.error('Debug error:', error);
  }
}

debugUser();








