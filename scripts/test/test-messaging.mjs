#!/usr/bin/env node
/**
 * Test script for messaging system
 * Tests the critical paths: profile search, conversation creation, message sending
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testMessaging() {
  console.log('🧪 Testing Messaging System\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Get profiles (simulating the /api/profiles endpoint behavior)
  console.log('Test 1: Profile search with OR logic...');
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .or('username.ilike.%test%,full_name.ilike.%test%')
      .limit(5);

    if (error) throw error;
    console.log(`  ✅ Found ${profiles.length} profiles matching "test"`);
    passed++;
  } catch (e) {
    console.log(`  ❌ Profile search failed: ${e.message}`);
    failed++;
  }

  // Test 2: Get two real profiles for testing conversations
  console.log('\nTest 2: Get two profiles for conversation test...');
  let user1, user2;
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, username, full_name')
      .limit(2);

    if (error) throw error;
    if (profiles.length < 2) {
      console.log('  ⚠️ Need at least 2 profiles to test conversations');
      // Create a second profile if needed
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({ username: 'test_user_' + Date.now(), full_name: 'Test User' })
        .select()
        .single();

      if (createError) throw createError;
      profiles.push(newProfile);
    }

    user1 = profiles[0];
    user2 = profiles[1];
    console.log(`  ✅ Found users: ${user1.username} and ${user2.username}`);
    passed++;
  } catch (e) {
    console.log(`  ❌ Get profiles failed: ${e.message}`);
    failed++;
  }

  // Test 3: Create direct conversation using RPC
  console.log('\nTest 3: Create direct conversation via RPC...');
  let conversationId;
  try {
    if (!user1 || !user2) throw new Error('No users available');

    const { data: convId, error } = await supabase
      .rpc('create_direct_conversation', {
        participant1_id: user1.id,
        participant2_id: user2.id
      });

    if (error) throw error;
    conversationId = convId;
    console.log(`  ✅ Created/found conversation: ${conversationId}`);
    passed++;
  } catch (e) {
    console.log(`  ❌ Create conversation failed: ${e.message}`);
    failed++;
  }

  // Test 4: Send a message using RPC
  console.log('\nTest 4: Send message via RPC...');
  try {
    if (!conversationId || !user1) throw new Error('No conversation or user available');

    const { data: msgId, error } = await supabase
      .rpc('send_message', {
        p_conversation_id: conversationId,
        p_sender_id: user1.id,
        p_content: `Test message from script at ${new Date().toISOString()}`
      });

    if (error) throw error;
    console.log(`  ✅ Sent message: ${msgId}`);
    passed++;
  } catch (e) {
    console.log(`  ❌ Send message failed: ${e.message}`);
    failed++;
  }

  // Test 5: Get conversations via RPC
  console.log('\nTest 5: Get user conversations via RPC...');
  try {
    if (!user1) throw new Error('No user available');

    const { data: conversations, error } = await supabase
      .rpc('get_user_conversations', { p_user_id: user1.id });

    if (error) throw error;
    console.log(`  ✅ Found ${conversations.length} conversations for ${user1.username}`);

    // Verify participants structure
    if (conversations.length > 0) {
      const conv = conversations[0];
      if (conv.participants && Array.isArray(conv.participants)) {
        console.log(`     - First conversation has ${conv.participants.length} participants`);
        console.log(`     - Unread count: ${conv.unread_count}`);
      }
    }
    passed++;
  } catch (e) {
    console.log(`  ❌ Get conversations failed: ${e.message}`);
    failed++;
  }

  // Test 6: Get messages via view
  console.log('\nTest 6: Get messages via message_details view...');
  try {
    if (!conversationId) throw new Error('No conversation available');

    const { data: messages, error } = await supabase
      .from('message_details')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(10);

    if (error) throw error;
    console.log(`  ✅ Found ${messages.length} messages in conversation`);

    // Verify message structure
    if (messages.length > 0) {
      const msg = messages[0];
      if (msg.sender && msg.sender.username) {
        console.log(`     - First message from: ${msg.sender.username || msg.sender.name}`);
      }
    }
    passed++;
  } catch (e) {
    console.log(`  ❌ Get messages failed: ${e.message}`);
    failed++;
  }

  // Test 7: Mark conversation as read
  console.log('\nTest 7: Mark conversation as read...');
  try {
    if (!conversationId || !user2) throw new Error('No conversation or user available');

    const { error } = await supabase
      .rpc('mark_conversation_read', {
        p_conversation_id: conversationId,
        p_user_id: user2.id
      });

    if (error) throw error;
    console.log(`  ✅ Marked conversation as read for ${user2.username}`);
    passed++;
  } catch (e) {
    console.log(`  ❌ Mark read failed: ${e.message}`);
    failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Results: ${passed} passed, ${failed} failed`);

  if (failed === 0) {
    console.log('\n✅ All messaging backend tests passed!');
    console.log('\n📝 Manual testing needed:');
    console.log('   1. Open http://localhost:3000/messages in browser');
    console.log('   2. Log in with a test account');
    console.log('   3. Click "New" to start a conversation');
    console.log('   4. Search for a user');
    console.log('   5. Click "Message" to create conversation');
    console.log('   6. Send a test message');
  } else {
    console.log('\n❌ Some tests failed - check errors above');
    process.exit(1);
  }
}

testMessaging().catch(console.error);
