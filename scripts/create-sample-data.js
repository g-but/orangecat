#!/usr/bin/env node

/**
 * Create Sample Data Script
 *
 * Adds sample projects and profiles to test the Discover functionality
 */

const { createClient } = require('@supabase/supabase-js');

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
  console.error('❌ Please set up your Supabase credentials first:');
  console.log('   node scripts/setup-supabase-env.js');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const sampleData = {
  profiles: [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      username: 'bitcoin_artist',
      name: 'Sarah Chen',
      bio: 'Digital artist creating Bitcoin-themed illustrations and NFTs. Supporting open-source art tools.',
      avatar_url: null,
      created_at: '2025-01-15T10:00:00Z',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      username: 'solar_innovator',
      name: 'Marcus Rodriguez',
      bio: 'Solar energy entrepreneur building sustainable solutions for communities in need.',
      avatar_url: null,
      created_at: '2025-01-20T14:30:00Z',
    },
  ],
  projects: [
    {
      id: '660e8400-e29b-41d4-a716-446655440001',
      user_id: '550e8400-e29b-41d4-a716-446655440001',
      title: 'Bitcoin Art Collective',
      description: 'Creating a community platform for Bitcoin artists to collaborate and showcase their work. We need funding for development tools and community outreach.',
      bitcoin_address: 'bc1qexampleaddress123456789',
      category: 'creative',
      status: 'active',
      goal_amount: 5000,
      currency: 'CHF',
      raised_amount: 1250,
      banner_url: null,
      featured_image_url: null,
      created_at: '2025-01-16T09:00:00Z',
      updated_at: '2025-01-16T09:00:00Z',
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440002',
      user_id: '550e8400-e29b-41d4-a716-446655440002',
      title: 'Solar Power for Rural Communities',
      description: 'Installing solar panels and battery systems in remote communities to provide clean, sustainable energy. Each installation powers 5-10 homes.',
      bitcoin_address: 'bc1qanotherexample987654321',
      category: 'environment',
      status: 'active',
      goal_amount: 15000,
      currency: 'CHF',
      raised_amount: 3200,
      banner_url: null,
      featured_image_url: null,
      created_at: '2025-01-22T11:15:00Z',
      updated_at: '2025-01-22T11:15:00Z',
    },
  ],
};

async function createSampleData() {
  console.log('🌱 Creating sample data for testing...\n');

  try {
    // Insert profiles
    console.log('👥 Inserting sample profiles...');
    for (const profile of sampleData.profiles) {
      const { error } = await supabase
        .from('profiles')
        .upsert(profile, { onConflict: 'id' });

      if (error) {
        console.log(`⚠️ Profile ${profile.username}: ${error.message}`);
      } else {
        console.log(`✅ Created profile: ${profile.username}`);
      }
    }

    // Insert projects
    console.log('\n📋 Inserting sample projects...');
    for (const project of sampleData.projects) {
      const { error } = await supabase
        .from('projects')
        .upsert(project, { onConflict: 'id' });

      if (error) {
        console.log(`⚠️ Project "${project.title}": ${error.message}`);
      } else {
        console.log(`✅ Created project: "${project.title}"`);
      }
    }

    console.log('\n🎉 Sample data created successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • ${sampleData.profiles.length} profiles`);
    console.log(`   • ${sampleData.projects.length} active projects`);
    console.log('\n🔍 Test the Discover page:');
    console.log('   npm run d');
    console.log('   Visit: http://localhost:3007/discover');

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  createSampleData();
}

