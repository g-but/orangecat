const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixParticipants() {
  try {
    console.log('Fixing messaging participants...');

    const maoUserId = 'cec88bc9-557f-452b-92f1-e093092fecd6';

    // Get all conversations
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id, title');

    if (convError) {
      console.error('Error fetching conversations:', convError);
      return;
    }

    console.log(`Found ${conversations.length} conversations`);

    let addedCount = 0;

    // For each conversation, add mao if not already a participant
    for (const conv of conversations) {
      const { data: existingParticipant, error: partError } = await supabase
        .from('conversation_participants')
        .select('*')
        .eq('conversation_id', conv.id)
        .eq('user_id', maoUserId)
        .maybeSingle();

      if (partError && partError.code !== 'PGRST116') { // PGRST116 is "not found" which is expected
        console.error('Error checking participant:', partError);
        continue;
      }

      if (!existingParticipant) {
        console.log(`Adding mao to conversation: ${conv.title || 'Untitled'}`);

        const { error: insertError } = await supabase
          .from('conversation_participants')
          .insert({
            conversation_id: conv.id,
            user_id: maoUserId,
            role: 'member',
            is_active: true
          });

        if (insertError) {
          console.error('Error adding participant:', insertError);
        } else {
          addedCount++;
        }
      }
    }

    console.log(`Successfully added mao as participant to ${addedCount} conversations`);

  } catch (error) {
    console.error('Script error:', error);
  }
}

fixParticipants();








