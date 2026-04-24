#!/usr/bin/env node

/**
 * Setup Orange Cat Subscription Funding
 *
 * This script creates the Orange Cat organization and subscription projects
 * for funding AI development tools (Claude Code and Cursor).
 */

const { createClient } = require('@supabase/supabase-js');

// Environment variables
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ohkueislstxomdjavyhs.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'REDACTED_ANON_KEY';

async function setupSubscriptionFunding() {
  console.log('🚀 Setting up Orange Cat subscription funding...');

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Check if Orange Cat organization already exists
    const { data: existingOrg, error: fetchError } = await supabase
      .from('organizations')
      .select('*')
      .eq('slug', 'orange-cat')
      .single();

    let organizationId;

    if (existingOrg) {
      console.log('✅ Orange Cat organization already exists:', existingOrg.id);
      organizationId = existingOrg.id;
    } else {
      console.log('📋 Creating Orange Cat organization...');

      // For this demo, we'll need to create a user account first
      // Since we can't do that programmatically with anon key, let's create a placeholder
      // In production, the user would create this through the UI

      console.log('❗ To create the Orange Cat organization, you need to:');
      console.log('1. Register/login to the application');
      console.log('2. Go to /organizations page');
      console.log('3. Click "Create Organization"');
      console.log('4. Fill in the details exactly as shown below:');
      console.log('');
      console.log('   Organization Name: Orange Cat');
      console.log('   Type: Foundation');
      console.log(
        '   Description: Official Orange Cat organization for funding AI development tools including Claude Code and Cursor subscriptions. Support the development of this Bitcoin crowdfunding platform.'
      );
      console.log('   Category: Technology');
      console.log('   Website: https://orangecat.com');
      console.log('   Treasury Address: bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh');
      console.log('   Tags: bitcoin, crowdfunding, ai, development, opensource');
      console.log("   Make it public and don't require approval");
      console.log('');
      console.log(
        '✅ After creating the organization, run this script again to set up the projects.'
      );

      return;
    }

    // Create subscription projects

    // 1. Claude Code Subscription Project
    console.log('📋 Creating Claude Code subscription project...');
    const { data: claudeProject, error: claudeError } = await supabase
      .from('projects')
      .insert({
        creator_id: organizationId, // Using organization ID as creator_id
        title: 'Fund Claude Code Subscription',
        description:
          'Help fund 1 year of Claude Code subscription to accelerate Orange Cat development. Claude Code provides advanced AI coding assistance that enables faster, higher-quality development.',
        goal_amount: 120000000, // 1.2 BTC (roughly $100/month * 12 months at current rates)
        category: 'technology',
        tags: ['ai', 'development', 'coding', 'subscription'],
        is_public: true,
        is_active: true,
        funding_deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (claudeError) {
      console.warn(`Warning creating Claude project: ${claudeError.message}`);
    } else {
      console.log('✅ Claude Code project created:', claudeProject.id);
    }

    // 2. Cursor Subscription Project
    console.log('📋 Creating Cursor subscription project...');
    const { data: cursorProject, error: cursorError } = await supabase
      .from('projects')
      .insert({
        creator_id: organizationId,
        title: 'Fund Cursor IDE Subscription',
        description:
          'Support funding for Cursor IDE subscription to enhance the development experience. Cursor provides a modern, AI-enhanced coding environment that boosts productivity.',
        goal_amount: 96000000, // 0.96 BTC (roughly $80/month * 12 months)
        category: 'technology',
        tags: ['ide', 'development', 'productivity', 'subscription'],
        is_public: true,
        is_active: true,
        funding_deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (cursorError) {
      console.warn(`Warning creating Cursor project: ${cursorError.message}`);
    } else {
      console.log('✅ Cursor project created:', cursorProject.id);
    }

    // 3. General Development Fund Project
    console.log('📋 Creating general development fund project...');
    const { data: generalProject, error: generalError } = await supabase
      .from('projects')
      .insert({
        creator_id: organizationId,
        title: 'Orange Cat Development Fund',
        description:
          'General fund to support ongoing development of the Orange Cat Bitcoin crowdfunding platform. Your contributions help maintain servers, improve features, and expand the platform.',
        goal_amount: 50000000, // 0.5 BTC for general development
        category: 'technology',
        tags: ['development', 'platform', 'bitcoin', 'opensource'],
        is_public: true,
        is_active: true,
        funding_deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (generalError) {
      console.warn(`Warning creating general fund project: ${generalError.message}`);
    } else {
      console.log('✅ General development fund project created:', generalProject.id);
    }

    console.log('\n🎉 Orange Cat subscription funding setup complete!');
    console.log('\n📊 Summary:');
    console.log(`Organization: Orange Cat (${organizationId})`);
    console.log(`Treasury Address: bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh`);
    console.log('\n💰 Projects Created:');
    if (claudeProject) {
      console.log(`- Claude Code: ${claudeProject.id} (1.2 BTC goal)`);
    }
    if (cursorProject) {
      console.log(`- Cursor IDE: ${cursorProject.id} (0.96 BTC goal)`);
    }
    if (generalProject) {
      console.log(`- Development Fund: ${generalProject.id} (0.5 BTC goal)`);
    }

    console.log('\n🚀 Next steps:');
    console.log('1. Users can now contribute Bitcoin to fund these subscriptions');
    console.log('2. Organization members can track funding progress');
    console.log('3. When goals are reached, subscriptions can be renewed');
  } catch (error) {
    console.error('❌ Error setting up subscription funding:', error.message);
    process.exit(1);
  }
}

// Run the setup
setupSubscriptionFunding()
  .then(() => {
    console.log('✅ Setup complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  });
