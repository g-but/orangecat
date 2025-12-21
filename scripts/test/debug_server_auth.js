// Debug server-side authentication issue
import { createServerClient } from './src/lib/supabase/server.ts';

// This script helps debug why server-side authentication is failing
// even though client-side authentication works

async function debugServerAuth() {
  console.log('🔍 Debugging server-side authentication...');

  try {
    // Create server client (this should work in server context)
    const supabase = await createServerClient();
    console.log('✅ Server client created successfully');

    // Try to get user (this is what's failing in API routes)
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error('❌ Error getting user:', error.message);
      console.error('❌ Error details:', error);
      return;
    }

    if (!user) {
      console.log('❌ No user found (this is expected in server context without cookies)');
      console.log('💡 This suggests cookies are not being passed correctly from browser to server');

      // Let's check what cookies are available
      console.log('📋 Checking cookie handling...');

      // Note: In a real server environment, we would have access to cookies
      // but this script runs in Node.js context
      console.log('💡 To debug further, we need to check:');
      console.log('   1. Are cookies being set correctly by Supabase Auth?');
      console.log('   2. Are cookies being sent from browser to API routes?');
      console.log('   3. Is the server client configured correctly?');

      return;
    }

    console.log('✅ User found:', user.id, user.email);

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error('❌ Stack:', error.stack);
  }
}

debugServerAuth();
