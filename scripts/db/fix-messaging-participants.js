const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixMessagingParticipants() {
  try {
    // First, let's see what conversations exist and what users are in them
    console.log('Checking existing conversations and participants...');

    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id, title, is_group, created_by');

    if (convError) {
      console.error('Error fetching conversations:', convError);
      return;
    }

    console.log(`Found ${conversations.length} conversations`);

    for (const conv of conversations) {
      console.log(`\nConversation ${conv.id}:`);
      console.log(`  Title: ${conv.title || 'Untitled'}`);
      console.log(`  Group: ${conv.is_group}`);
      console.log(`  Created by: ${conv.created_by}`);

      const { data: participants, error: partError } = await supabase
        .from('conversation_participants')
        .select('user_id, role, is_active')
        .eq('conversation_id', conv.id);

      if (partError) {
        console.error('Error fetching participants:', partError);
      } else {
        console.log(`  Participants: ${participants.length}`);
        participants.forEach(p => {
          console.log(`    - ${p.user_id} (${p.role}, active: ${p.is_active})`);
        });
      }
    }

    // Now let's find the user with username 'mao'
    const { data: maoUser, error: userError } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('username', 'mao')
      .single();

    if (userError || !maoUser) {
      console.error('Could not find user "mao":', userError);
      return;
    }

    const userId = maoUser.id;
    console.log(`\nFound user "mao" with ID: ${userId}`);

    // Now add mao as a participant to all conversations where they're missing
    console.log('\nAdding mao as participant to conversations...');

    // Now add mao as a participant to all conversations where they're missing
    for (const conv of conversations) {
      console.log(`Checking conversation ${conv.id} (${conv.title || 'Untitled'})`);

      const { data: existingParticipant, error: partError } = await supabase
        .from('conversation_participants')
        .select('*')
        .eq('conversation_id', conv.id)
        .eq('user_id', userId)
        .maybeSingle();

      if (partError) {
        console.error('Error checking participant:', partError);
        continue;
      }

      if (!existingParticipant) {
        console.log(`Adding mao as participant to conversation ${conv.id}`);

        const { error: insertError } = await supabase
          .from('conversation_participants')
          .insert({
            conversation_id: conv.id,
            user_id: userId,
            role: conv.created_by === userId ? 'admin' : 'member',
            is_active: true
          });

        if (insertError) {
          console.error('Error adding participant:', insertError);
        } else {
          console.log('Successfully added participant');
        }
      } else {
        console.log('mao is already a participant');
      }
    }

    console.log('Done fixing participants!');

  } catch (error) {
    console.error('Script error:', error);
  }
}

fixMessagingParticipants();


























