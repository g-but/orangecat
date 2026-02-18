#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTables() {
  console.log('🔍 Checking messaging tables...\n');

  const tables = [
    'conversations',
    'conversation_participants',
    'messages',
    'message_read_receipts',
  ];

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error && error.code === 'PGRST116') {
        console.log(`❌ Table '${table}' does not exist`);
      } else if (error) {
        console.log(`⚠️  Table '${table}' exists but has error: ${error.message}`);
      } else {
        console.log(`✅ Table '${table}' exists`);
      }
    } catch (error) {
      console.log(`❌ Error checking table '${table}': ${error.message}`);
    }
  }

  // Check functions
  console.log('\n🔍 Checking functions...\n');
  const functions = ['create_direct_conversation', 'send_message', 'mark_conversation_read'];

  for (const func of functions) {
    try {
      const { data, error } = await supabase.rpc(func);
      if (error && error.code === 'PGRST202') {
        console.log(`❌ Function '${func}' does not exist`);
      } else if (error) {
        console.log(`⚠️  Function '${func}' exists but has error: ${error.message}`);
      } else {
        console.log(`✅ Function '${func}' exists`);
      }
    } catch (error) {
      console.log(`❌ Error checking function '${func}': ${error.message}`);
    }
  }

  // Check views
  console.log('\n🔍 Checking views...\n');
  const views = ['conversation_details', 'message_details'];

  for (const view of views) {
    try {
      const { data, error } = await supabase.from(view).select('*').limit(1);
      if (error && error.code === 'PGRST116') {
        console.log(`❌ View '${view}' does not exist`);
      } else if (error) {
        console.log(`⚠️  View '${view}' exists but has error: ${error.message}`);
      } else {
        console.log(`✅ View '${view}' exists`);
      }
    } catch (error) {
      console.log(`❌ Error checking view '${view}': ${error.message}`);
    }
  }
}

checkTables().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
