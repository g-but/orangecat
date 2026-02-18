#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestProfiles() {
  console.log('👤 Creating test profiles...\n');

  const testProfiles = [
    {
      id: uuidv4(),
      username: 'alice_test',
      full_name: 'Alice Johnson',
    },
    {
      id: uuidv4(),
      username: 'bob_test',
      full_name: 'Bob Smith',
    },
    {
      id: uuidv4(),
      username: 'charlie_test',
      full_name: 'Charlie Brown',
    },
  ];

  for (const profile of testProfiles) {
    try {
      const { data, error } = await supabase.from('profiles').insert(profile).select();

      if (error) {
        console.log(`❌ Failed to create profile ${profile.username}: ${error.message}`);
      } else {
        console.log(`✅ Created profile: ${profile.username} (${profile.id})`);
      }
    } catch (error) {
      console.log(`❌ Error creating profile ${profile.username}: ${error.message}`);
    }
  }

  console.log('\n🎉 Test profiles creation complete!');
}

createTestProfiles().catch(console.error);
