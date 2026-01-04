#!/usr/bin/env node

/**
 * Test Setup Verification Script
 *
 * Verifies that all test data was created correctly and provides
 * a summary of what's available for testing.
 *
 * USAGE:
 *   node scripts/verify-test-setup.js
 */

const { createClient } = require('@supabase/supabase-js');

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function verifySetup() {
  console.log('🔍 Verifying Test Setup...\n');

  const results = {
    profiles: 0,
    projects: 0,
    products: 0,
    services: 0,
    loans: 0,
    organizations: 0,
    transactions: 0,
  };

  try {
    // Check profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, name')
      .not('username', 'is', null);

    if (!profilesError && profiles) {
      results.profiles = profiles.length;
      console.log(`👥 Profiles: ${results.profiles}`);
      profiles.slice(0, 5).forEach(p => console.log(`   - ${p.username} (${p.name})`));
      if (profiles.length > 5) console.log(`   ... and ${profiles.length - 5} more`);
    }

    // Check projects
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, title, status, user_id')
      .eq('status', 'active');

    if (!projectsError && projects) {
      results.projects = projects.length;
      console.log(`\n🎯 Active Projects: ${results.projects}`);
      projects.slice(0, 3).forEach(p => console.log(`   - "${p.title}" (${p.status})`));
      if (projects.length > 3) console.log(`   ... and ${projects.length - 3} more`);
    }

    // Check products
    const { data: products, error: productsError } = await supabase
      .from('user_products')
      .select('id, title, price_sats, status')
      .eq('status', 'active');

    if (!productsError && products) {
      results.products = products.length;
      console.log(`\n🛒 Active Products: ${results.products}`);
      products.slice(0, 3).forEach(p => console.log(`   - "${p.title}" (${p.price_sats} sats)`));
      if (products.length > 3) console.log(`   ... and ${products.length - 3} more`);
    }

    // Check services
    const { data: services, error: servicesError } = await supabase
      .from('user_services')
      .select('id, title, fixed_price_sats, hourly_rate_sats, status')
      .eq('status', 'active');

    if (!servicesError && services) {
      results.services = services.length;
      console.log(`\n🔧 Active Services: ${results.services}`);
      services.slice(0, 3).forEach(s => {
        const price = s.fixed_price_sats
          ? `${s.fixed_price_sats} sats`
          : `${s.hourly_rate_sats} sats/hr`;
        console.log(`   - "${s.title}" (${price})`);
      });
      if (services.length > 3) console.log(`   ... and ${services.length - 3} more`);
    }

    // Check loans
    const { data: loans, error: loansError } = await supabase
      .from('loans')
      .select('id, title, original_amount, status')
      .eq('status', 'active');

    if (!loansError && loans) {
      results.loans = loans.length;
      console.log(`\n💰 Active Loans: ${results.loans}`);
      loans.slice(0, 2).forEach(l => console.log(`   - "${l.title}" (${l.original_amount} sats)`));
      if (loans.length > 2) console.log(`   ... and ${loans.length - 2} more`);
    }

    // Check organizations
    const { data: organizations, error: organizationsError } = await supabase
      .from('organizations')
      .select('id, name, slug');

    if (!organizationsError && organizations) {
      results.organizations = organizations.length;
      console.log(`\n🏢 Organizations: ${results.organizations}`);
      organizations.forEach(o => console.log(`   - "${o.name}" (${o.slug})`));
    }

    // Check transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('id, amount_sats, status')
      .eq('status', 'completed');

    if (!transactionsError && transactions) {
      results.transactions = transactions.length;
      console.log(`\n💸 Completed Transactions: ${results.transactions}`);
      if (transactions.length > 0) {
        const totalAmount = transactions.reduce((sum, t) => sum + t.amount_sats, 0);
        console.log(`   - Total volume: ${totalAmount} sats`);
      }
    }
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SETUP VERIFICATION COMPLETE');
  console.log('='.repeat(50));

  const totalEntities = Object.values(results).reduce((sum, count) => sum + count, 0);

  console.log(`\n🎯 Total Test Entities Created: ${totalEntities}`);
  console.log('\nBreakdown:');
  Object.entries(results).forEach(([type, count]) => {
    console.log(`   ${type.padEnd(12)}: ${count}`);
  });

  // Readiness assessment
  const minRequirements = {
    profiles: 4,
    projects: 3,
    products: 2,
    services: 2,
    loans: 1,
    organizations: 1,
  };

  const readyForTesting = Object.entries(minRequirements).every(
    ([type, min]) => results[type] >= min
  );

  console.log('\n🏁 TESTING READINESS:');

  if (readyForTesting) {
    console.log('   ✅ FULLY READY - All workflows can be tested!');
    console.log('\n🚀 NEXT STEPS:');
    console.log('   1. Start app: npm run dev');
    console.log('   2. Login as test users (TestPassword123!)');
    console.log('   3. Follow TESTING_WORKFLOWS_GUIDE.md');
    console.log('   4. Run final verification: node scripts/db-verify-fixes.mjs');
  } else {
    console.log('   ⚠️  PARTIALLY READY - Some entities missing');
    console.log('\n💡 Run setup again: node scripts/setup-comprehensive-testing.js');
  }

  console.log('\n🔗 QUICK ACCESS URLs:');
  console.log('   🏠 Homepage:    http://localhost:3000');
  console.log('   🔍 Discover:    http://localhost:3000/discover');
  console.log('   🎯 Projects:    http://localhost:3000/projects');
  console.log('   🛒 Products:    http://localhost:3000/products');
  console.log('   🔧 Services:    http://localhost:3000/services');
  console.log('   💰 Loans:       http://localhost:3000/loans');
  console.log('   🏢 Orgs:        http://localhost:3000/organizations');

  console.log('\n📝 Test User Credentials:');
  console.log('   👤 project_creator / TestPassword123!');
  console.log('   👤 service_provider / TestPassword123!');
  console.log('   👤 investor_bob / TestPassword123!');
  console.log('   👤 community_org / TestPassword123!');

  console.log('\n' + '='.repeat(50));
}

verifySetup().catch(error => {
  console.error('💥 Verification error:', error);
  process.exit(1);
});



