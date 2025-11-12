#!/usr/bin/env node

/**
 * Add test data to the database
 */

const { createClient } = require('@supabase/supabase-js');

// Get credentials from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addTestData() {
  console.log('🌱 Adding test data to database...\n');

  try {
    // Add a test profile
    console.log('👤 Adding test profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: '550e8400-e29b-41d4-a716-446655440001',
        username: 'bitcoin_creator',
        name: 'Alex Bitcoin',
        bio: 'Creating innovative Bitcoin solutions and community projects.',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select();

    if (profileError) {
      console.log('⚠️ Profile creation failed:', profileError.message);
    } else {
      console.log('✅ Added profile:', profile[0]?.username);
    }

    // Add test projects
    console.log('\n📋 Adding test projects...');

    const projects = [
      {
        name: 'Bitcoin Learning Platform',
        description: 'An interactive platform to help people learn about Bitcoin fundamentals, security, and best practices.',
        owner_type: 'profile',
        owner_id: '550e8400-e29b-41d4-a716-446655440001',
        bitcoin_address: 'bc1qtest123456789',
        category: 'education',
        status: 'active',
        tags: ['bitcoin', 'education', 'security'],
        start_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        name: 'Community Garden Bitcoin Fund',
        description: 'Supporting local community gardens with Bitcoin donations to grow sustainable food sources.',
        owner_type: 'profile',
        owner_id: '550e8400-e29b-41d4-a716-446655440001',
        bitcoin_address: 'bc1qgarden987654321',
        category: 'community',
        status: 'active',
        tags: ['community', 'gardening', 'sustainability'],
        start_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ];

    for (const project of projects) {
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .insert(project)
        .select();

      if (projectError) {
        console.log(`⚠️ Project "${project.name}" failed:`, projectError.message);
      } else {
        console.log(`✅ Added project: "${project.name}"`);
      }
    }

    console.log('\n🎉 Test data added successfully!');
    console.log('\n📊 Summary:');
    console.log('   • 1 test profile');
    console.log('   • 2 test projects');
    console.log('\n🔍 Refresh the Discover page to see the data!');

  } catch (error) {
    console.error('❌ Error adding test data:', error);
  }
}

// Run the script
addTestData();
