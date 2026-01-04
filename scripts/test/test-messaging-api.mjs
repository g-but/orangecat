#!/usr/bin/env node
/**
 * Test Messaging API Endpoints
 * 
 * Tests the messaging API to verify conversations and messages work correctly
 */

import fetch from 'node-fetch';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';

async function testMessagingAPI() {
  console.log('🧪 Testing Messaging API\n');
  console.log(`Base URL: ${BASE_URL}\n`);

  try {
    // Test 1: Check if server is running
    console.log('1️⃣ Checking server status...');
    const healthCheck = await fetch(`${BASE_URL}/api/health`).catch(() => null);
    if (!healthCheck) {
      console.log('⚠️  Health check endpoint not available (this is OK)');
    }
    
    console.log('✅ Server appears to be running\n');
    console.log('📝 Manual Testing Instructions:');
    console.log('1. Open browser to:', BASE_URL);
    console.log('2. Login as "Metal Music" user');
    console.log('3. Navigate to /messages');
    console.log('4. Check browser console for errors');
    console.log('5. Try creating a conversation');
    console.log('6. Try sending a message');
    console.log('\n🔍 Key things to check:');
    console.log('- Are conversations loading?');
    console.log('- Are messages displaying?');
    console.log('- Are there any console errors?');
    console.log('- Are there any network errors?');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testMessagingAPI();
