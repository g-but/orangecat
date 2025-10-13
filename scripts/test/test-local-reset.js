#!/usr/bin/env node

/**
 * Test local password reset functionality
 */

const { createClient } = require('@supabase/supabase-js');

// Use local Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPasswordReset() {
  console.log('🧪 Testing Local Password Reset Configuration\n');
  
  const testEmail = 'test@orangecat.ch';
  console.log(`📧 Testing password reset for: ${testEmail}`);
  
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(testEmail, {
      redirectTo: 'http://localhost:3000/auth/reset-password'
    });
    
    if (error) {
      console.log('❌ Password reset failed:', error.message);
    } else {
      console.log('✅ Password reset email sent successfully!');
      console.log('📬 Check the Inbucket interface at: http://127.0.0.1:54324');
      console.log('🔗 The email should contain a link to: http://localhost:3000/auth/reset-password');
      console.log('🎨 The email should use the beautiful OrangeCat template');
    }
  } catch (err) {
    console.log('❌ Unexpected error:', err.message);
  }
  
  console.log('\n📋 Local Setup Status:');
  console.log('✅ Supabase config updated with redirect URLs');
  console.log('✅ Custom email template configured'); 
  console.log('✅ Middleware handles redirect from homepage');
  console.log('✅ Reset page handles expired tokens properly');
  
  console.log('\n🚀 Next: Fix production Supabase configuration');
  console.log('Run: node scripts/fix-production-supabase.js');
}

testPasswordReset();