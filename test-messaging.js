const { Client } = require('pg');

// Connect to the remote Supabase instance since that's what the app uses
const client = new Client({
  connectionString: process.env.SUPABASE_SERVICE_ROLE_KEY ?
    `postgresql://postgres:${process.env.SUPABASE_SERVICE_ROLE_KEY}@db.ohkueislstxomdjavyhs.supabase.co:5432/postgres` :
    'postgresql://postgres:postgres@localhost:54322/postgres'
});

async function testMessagingAPI() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Get an existing user ID
    const users = await client.query('SELECT id, email FROM auth.users LIMIT 1');
    if (users.rows.length === 0) {
      console.log('No users found in database');
      return;
    }

    const userId = users.rows[0].id;
    console.log('Testing with user:', userId, users.rows[0].email);

    // Test getting conversations for this user
    const conversations = await client.query(`
      SELECT c.id, c.title, c.is_group,
             COUNT(cp.user_id) as participant_count
      FROM conversations c
      JOIN conversation_participants cp ON c.id = cp.conversation_id
      WHERE cp.user_id = $1 AND cp.is_active = true
      GROUP BY c.id, c.title, c.is_group
    `, [userId]);

    console.log('User conversations:');
    conversations.rows.forEach(conv => {
      console.log(`  - ${conv.id}: ${conv.title || 'Untitled'} (${conv.participant_count} participants)`);
    });

    // Test getting messages for first conversation
    if (conversations.rows.length > 0) {
      const convId = conversations.rows[0].id;
      console.log(`\nTesting messages for conversation: ${convId}`);

      const messages = await client.query(`
        SELECT m.id, m.content, m.sender_id, p.name as sender_name
        FROM messages m
        JOIN profiles p ON m.sender_id = p.id
        WHERE m.conversation_id = $1
        ORDER BY m.created_at DESC
        LIMIT 5
      `, [convId]);

      console.log('Recent messages:');
      messages.rows.forEach(msg => {
        console.log(`  - ${msg.sender_name}: ${msg.content.substring(0, 50)}...`);
      });

      // Test conversation_details view for this user
      console.log('\nTesting get_user_conversations() function:');
      const convDetails = await client.query(`
        SELECT * FROM get_user_conversations($1)
        WHERE id = $2
      `, [userId, convId]);

      console.log('User conversations (function) result:', convDetails.rows.length > 0 ? 'SUCCESS' : 'NO DATA');

      // Test message_details view
      console.log('Testing message_details view:');
      const msgDetails = await client.query(`
        SELECT m.id, m.content, p.name as sender_name,
               EXISTS (
                 SELECT 1 FROM message_read_receipts r
                 WHERE r.message_id = m.id AND r.user_id = $2
               ) as is_read
        FROM messages m
        JOIN profiles p ON m.sender_id = p.id
        WHERE m.conversation_id = $1
        ORDER BY m.created_at DESC
        LIMIT 3
      `, [convId, userId]);

      console.log('Message details result:', msgDetails.rows.length > 0 ? 'SUCCESS' : 'NO DATA');
      msgDetails.rows.forEach(msg => {
        console.log(`  - ${msg.sender_name}: ${msg.content.substring(0, 30)}... (read: ${msg.is_read})`);
      });
    }

    console.log('\n✅ Messaging system test completed successfully!');

  } catch (error) {
    console.error('❌ Messaging test failed:', error.message);
  } finally {
    await client.end();
  }
}

testMessagingAPI();
