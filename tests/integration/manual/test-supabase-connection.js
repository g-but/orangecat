#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Get environment variables
const SUPABASE_URL = 'https://ohkueislstxomdjavyhs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oa3VlaXNsc3R4b21kamF2eWhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1NDc5NTAsImV4cCI6MjA2MDEyMzk1MH0.Qc6ahUbs_5BCa4csEYsBttyxNUDYb4h3Y4K_16N1DNaY';

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection...');
  console.log(`📍 Project: ${SUPABASE_URL}`);
  console.log('');

  try {
    // Create client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Test connection with simple query
    console.log('⏳ Attempting connection...');
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.log('❌ Connection FAILED:');
      console.log(`   Error: ${error.message}`);
      console.log('');
      console.log('🔧 Possible causes:');
      console.log('   • Project is still frozen/paused');
      console.log('   • Project is still starting up (try again in 1-2 minutes)');
      console.log('   • Invalid credentials');
      return false;
    } else {
      console.log('✅ Connection SUCCESSFUL!');
      console.log('   Supabase project is active and responding');
      console.log('');
      console.log('🎉 Your authentication should now work!');
      return true;
    }
  } catch (err) {
    console.log('❌ Connection ERROR:');
    console.log(`   ${err.message}`);
    console.log('');
    console.log('📝 This suggests the project is still frozen or starting up.');
    return false;
  }
}

// Run the test
testSupabaseConnection()
  .then(success => {
    if (success) {
      console.log('');
      console.log('🚀 Next steps:');
      console.log('   1. Restart your dev server: npm run dev');
      console.log('   2. Try logging in at: http://localhost:3020/auth');
      process.exit(0);
    } else {
      console.log('');
      console.log('⏰ If project was just unfrozen, wait 1-2 minutes and try again.');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  }); 