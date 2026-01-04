#!/usr/bin/env node
/**
 * Test Messaging API Endpoints
 * 
 * Tests the messaging API to verify conversations and messages work correctly
 * 
 * Usage: node scripts/test-messaging-api.js [email] [password]
 */

const fetch = require('node-fetch');

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';
const EMAIL = process.argv[2] || 'metal@music.com';
const PASSWORD = process.argv[3] || 'testpassword123';

async function testMessagingAPI() {
  console.log('🧪 Testing Messaging API\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Email: ${EMAIL}\n`);

  try {
    // Step 1: Login
    console.log('1️⃣ Logging in...');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });

    if (!loginRes.ok) {
      const errorText = await loginRes.text();
      console.error('❌ Login failed:', loginRes.status, errorText);
      return;
    }

    const loginData = await loginRes.json();
    console.log('✅ Login successful');
    const sessionToken = loginRes.headers.get('set-cookie') || '';

    // Step 2: Get conversations
    console.log('\n2️⃣ Fetching conversations...');
    const convRes = await fetch(`${BASE_URL}/api/messages?limit=30`, {
      headers: {
        'Cookie': sessionToken,
      },
    });

    if (!convRes.ok) {
      const errorText = await convRes.text();
      console.error('❌ Failed to fetch conversations:', convRes.status, errorText);
      return;
    }

    const convData = await convRes.json();
    console.log('✅ Conversations response:', JSON.stringify(convData, null, 2));
    
    const conversations = convData.data?.conversations || convData.conversations || [];
    console.log(`📊 Found ${conversations.length} conversations`);

    if (conversations.length > 0) {
      const firstConv = conversations[0];
      console.log(`\n3️⃣ Testing conversation: ${firstConv.id}`);
      
      // Step 3: Get messages for first conversation
      const messagesRes = await fetch(`${BASE_URL}/api/messages/${firstConv.id}`, {
        headers: {
          'Cookie': sessionToken,
        },
      });

      if (messagesRes.ok) {
        const messagesData = await messagesRes.json();
        const messages = messagesData.data?.messages || messagesData.messages || [];
        console.log(`✅ Found ${messages.length} messages in conversation`);
        console.log('📨 Sample message:', messages[0] ? JSON.stringify(messages[0], null, 2) : 'No messages');
      } else {
        const errorText = await messagesRes.text();
        console.error('❌ Failed to fetch messages:', messagesRes.status, errorText);
      }
    } else {
      console.log('\n⚠️  No conversations found. Creating a test conversation...');
      
      // Step 4: Create a conversation (self conversation)
      const selfConvRes = await fetch(`${BASE_URL}/api/messages/self`, {
        headers: {
          'Cookie': sessionToken,
        },
      });

      if (selfConvRes.ok) {
        const selfConvData = await selfConvRes.json();
        const conversationId = selfConvData.data?.conversationId || selfConvData.conversationId;
        console.log(`✅ Created self conversation: ${conversationId}`);
        
        // Step 5: Send a test message
        console.log('\n4️⃣ Sending test message...');
        const sendRes = await fetch(`${BASE_URL}/api/messages/${conversationId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': sessionToken,
          },
          body: JSON.stringify({
            content: 'Test message from API test script',
            messageType: 'text',
          }),
        });

        if (sendRes.ok) {
          const sendData = await sendRes.json();
          console.log('✅ Message sent:', JSON.stringify(sendData, null, 2));
        } else {
          const errorText = await sendRes.text();
          console.error('❌ Failed to send message:', sendRes.status, errorText);
        }
      } else {
        const errorText = await selfConvRes.text();
        console.error('❌ Failed to create conversation:', selfConvRes.status, errorText);
      }
    }

    console.log('\n✅ Testing complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testMessagingAPI();
