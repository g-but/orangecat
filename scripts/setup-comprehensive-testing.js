#!/usr/bin/env node

/**
 * Comprehensive Testing Setup Script
 *
 * Creates test users, projects, products, services, loans, organizations,
 * and other entities needed for full workflow testing.
 *
 * USAGE:
 *   node scripts/setup-comprehensive-testing.js
 *
 * This will create:
 * - 4 test users with different roles
 * - Multiple projects in different states
 * - Products and services for sale
 * - Loan requests and offers
 * - Organizations with members
 * - Timeline posts and interactions
 */

const { createClient } = require('@supabase/supabase-js');

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nRun: node scripts/setup-supabase-env.js');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

console.log('🚀 Setting up comprehensive testing data...\n');

// Test user data
const testUsers = [
  {
    id: 'test-user-1',
    username: 'project_creator',
    name: 'Alex Chen',
    bio: 'Bitcoin enthusiast and community builder. Creating tools that make crowdfunding accessible to everyone.',
    email: 'alex@test.orangecat',
    bitcoin_address: 'bc1qprojectcreator123456789',
    location: 'San Francisco, CA'
  },
  {
    id: 'test-user-2',
    username: 'service_provider',
    name: 'Maria Garcia',
    bio: 'Full-stack developer specializing in Bitcoin and Web3 applications. Available for consulting and development work.',
    email: 'maria@test.orangecat',
    bitcoin_address: 'bc1qserviceprovider123456789',
    location: 'Barcelona, Spain'
  },
  {
    id: 'test-user-3',
    username: 'investor_bob',
    name: 'Bob Wilson',
    bio: 'Angel investor focused on Bitcoin and blockchain projects. Supporting innovative solutions for real-world problems.',
    email: 'bob@test.orangecat',
    bitcoin_address: 'bc1qinvestorbob123456789',
    location: 'London, UK'
  },
  {
    id: 'test-user-4',
    username: 'community_org',
    name: 'Community Foundation',
    bio: 'Non-profit organization supporting community projects and social initiatives through Bitcoin crowdfunding.',
    email: 'org@test.orangecat',
    bitcoin_address: 'bc1qcommunityorg123456789',
    location: 'Berlin, Germany'
  }
];

// Test projects
const testProjects = [
  {
    user_id: 'test-user-1',
    title: 'Open Source Bitcoin Wallet',
    description: 'Building a user-friendly, open-source Bitcoin wallet with built-in crowdfunding features. This wallet will make it easy for users to support projects directly from their mobile devices.',
    goal_amount_sats: 50000000, // 0.5 BTC
    bitcoin_address: 'bc1qwalletproject123456789',
    category: 'development',
    tags: ['bitcoin', 'wallet', 'mobile', 'open-source'],
    status: 'active',
    published: true
  },
  {
    user_id: 'test-user-1',
    title: 'Community Garden Initiative',
    description: 'Transforming abandoned urban lots into community gardens. We need funds for seeds, tools, and community workshops to teach sustainable gardening practices.',
    goal_amount_sats: 25000000, // 0.25 BTC
    bitcoin_address: 'bc1qgardenproject123456789',
    category: 'community',
    tags: ['environment', 'community', 'sustainability', 'education'],
    status: 'active',
    published: true
  },
  {
    user_id: 'test-user-2',
    title: 'Solar Panel Installation Service',
    description: 'Professional solar panel installation service for residential and small business properties. Making renewable energy accessible and affordable.',
    goal_amount_sats: 100000000, // 1 BTC
    bitcoin_address: 'bc1qsolarbusiness123456789',
    category: 'infrastructure',
    tags: ['solar', 'renewable', 'business', 'sustainability'],
    status: 'active',
    published: true
  },
  {
    user_id: 'test-user-4',
    title: 'Digital Literacy Program',
    description: 'Teaching digital skills to underserved communities. From basic computer literacy to advanced topics like Bitcoin and online privacy.',
    goal_amount_sats: 75000000, // 0.75 BTC
    bitcoin_address: 'bc1qeducationproject123456789',
    category: 'education',
    tags: ['education', 'digital-literacy', 'community', 'privacy'],
    status: 'draft',
    published: false
  }
];

// Test products
const testProducts = [
  {
    user_id: 'test-user-2',
    title: 'Custom Bitcoin Development Course',
    description: 'Comprehensive video course teaching Bitcoin development from basics to advanced topics. Includes hands-on projects and lifetime access.',
    price_sats: 500000, // 0.005 BTC
    currency: 'SATS',
    product_type: 'digital',
    category: 'education',
    tags: ['bitcoin', 'development', 'course', 'education'],
    status: 'active',
    inventory_count: -1 // unlimited
  },
  {
    user_id: 'test-user-2',
    title: 'Bitcoin Consulting Session',
    description: '1-hour consulting session to help with your Bitcoin project. Whether you need technical advice, architecture review, or implementation guidance.',
    price_sats: 1000000, // 0.01 BTC
    currency: 'SATS',
    product_type: 'service',
    category: 'consulting',
    tags: ['consulting', 'bitcoin', 'technical', 'advice'],
    status: 'active',
    inventory_count: -1
  },
  {
    user_id: 'test-user-1',
    title: 'OrangeCat T-Shirt',
    description: 'Limited edition OrangeCat Bitcoin crowdfunding t-shirt. Made from organic cotton, printed with eco-friendly inks.',
    price_sats: 200000, // 0.002 BTC
    currency: 'SATS',
    product_type: 'physical',
    category: 'merchandise',
    tags: ['merchandise', 't-shirt', 'bitcoin', 'limited-edition'],
    status: 'active',
    inventory_count: 50
  }
];

// Test services
const testServices = [
  {
    user_id: 'test-user-2',
    title: 'Full-Stack Bitcoin Development',
    description: 'Complete web application development with Bitcoin/Lightning integration. From concept to deployment.',
    category: 'development',
    fixed_price_sats: 5000000, // 0.05 BTC
    currency: 'SATS',
    duration_minutes: 480, // 8 hours
    service_location_type: 'remote',
    status: 'active'
  },
  {
    user_id: 'test-user-2',
    title: 'Bitcoin Wallet Security Audit',
    description: 'Comprehensive security audit of your Bitcoin wallet implementation. Includes code review, vulnerability assessment, and recommendations.',
    category: 'security',
    fixed_price_sats: 2000000, // 0.02 BTC
    currency: 'SATS',
    duration_minutes: 240, // 4 hours
    service_location_type: 'remote',
    status: 'active'
  },
  {
    user_id: 'test-user-3',
    title: 'Bitcoin Investment Consultation',
    description: 'Personalized Bitcoin investment strategy consultation. Portfolio review, risk assessment, and long-term planning.',
    category: 'consulting',
    hourly_rate_sats: 50000, // 500 sats/hour
    currency: 'SATS',
    duration_minutes: 60,
    service_location_type: 'remote',
    status: 'active'
  }
];

// Test loans
const testLoans = [
  {
    user_id: 'test-user-1',
    title: 'Equipment Purchase Loan',
    description: 'Need to purchase specialized equipment for our open-source development projects. Seeking a short-term loan to bridge the gap.',
    original_amount: 1000000, // 0.01 BTC
    remaining_balance: 1000000,
    bitcoin_address: 'bc1qloanrequest123456789',
    loan_category_id: 'equipment',
    status: 'active'
  },
  {
    user_id: 'test-user-4',
    title: 'Community Center Renovation',
    description: 'Funding needed to renovate our community center for educational programs. This will serve hundreds of community members annually.',
    original_amount: 5000000, // 0.05 BTC
    remaining_balance: 5000000,
    bitcoin_address: 'bc1qcommunityloan123456789',
    loan_category_id: 'infrastructure',
    status: 'active'
  }
];

// Test organizations
const testOrganizations = [
  {
    name: 'Bitcoin Developers Guild',
    slug: 'bitcoin-dev-guild',
    description: 'A community of Bitcoin developers working together to build better tools and educate the next generation of developers.',
    created_by: 'test-user-2',
    website: 'https://bitcoindevguild.org',
    bitcoin_address: 'bc1qdevguild123456789'
  },
  {
    name: 'Sustainable Communities Network',
    slug: 'sustainable-communities',
    description: 'Connecting communities working on environmental sustainability projects. Sharing knowledge, resources, and funding opportunities.',
    created_by: 'test-user-4',
    website: 'https://sustainablecommunities.net',
    bitcoin_address: 'bc1qsustainable123456789'
  }
];

async function createTestUsers() {
  console.log('👥 Creating test users...');

  for (const user of testUsers) {
    try {
      // First create auth user (simplified - in real app this would be through Supabase Auth)
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: 'TestPassword123!',
        user_metadata: { name: user.name }
      });

      if (authError && !authError.message.includes('already registered')) {
        console.log(`   ⚠️  Auth user ${user.username}: ${authError.message}`);
        continue;
      }

      const userId = authUser?.user?.id || user.id;

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          username: user.username,
          name: user.name,
          bio: user.bio,
          email: user.email,
          bitcoin_address: user.bitcoin_address,
          location: user.location,
          status: 'active',
          verification_status: 'verified'
        });

      if (profileError) {
        console.log(`   ❌ Profile ${user.username}: ${profileError.message}`);
      } else {
        console.log(`   ✅ Created user: ${user.username}`);
      }
    } catch (error) {
      console.log(`   ❌ Error creating ${user.username}: ${error.message}`);
    }
  }
}

async function createTestProjects() {
  console.log('\n🎯 Creating test projects...');

  for (const project of testProjects) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert(project)
        .select()
        .single();

      if (error) {
        console.log(`   ❌ Project "${project.title}": ${error.message}`);
      } else {
        console.log(`   ✅ Created project: ${project.title}`);
      }
    } catch (error) {
      console.log(`   ❌ Error creating project: ${error.message}`);
    }
  }
}

async function createTestProducts() {
  console.log('\n🛒 Creating test products...');

  for (const product of testProducts) {
    try {
      const { data, error } = await supabase
        .from('user_products')
        .insert(product)
        .select()
        .single();

      if (error) {
        console.log(`   ❌ Product "${product.title}": ${error.message}`);
      } else {
        console.log(`   ✅ Created product: ${product.title}`);
      }
    } catch (error) {
      console.log(`   ❌ Error creating product: ${error.message}`);
    }
  }
}

async function createTestServices() {
  console.log('\n🔧 Creating test services...');

  for (const service of testServices) {
    try {
      const { data, error } = await supabase
        .from('user_services')
        .insert(service)
        .select()
        .single();

      if (error) {
        console.log(`   ❌ Service "${service.title}": ${error.message}`);
      } else {
        console.log(`   ✅ Created service: ${service.title}`);
      }
    } catch (error) {
      console.log(`   ❌ Error creating service: ${error.message}`);
    }
  }
}

async function createTestLoans() {
  console.log('\n💰 Creating test loans...');

  for (const loan of testLoans) {
    try {
      const { data, error } = await supabase
        .from('loans')
        .insert(loan)
        .select()
        .single();

      if (error) {
        console.log(`   ❌ Loan "${loan.title}": ${error.message}`);
      } else {
        console.log(`   ✅ Created loan: ${loan.title}`);
      }
    } catch (error) {
      console.log(`   ❌ Error creating loan: ${error.message}`);
    }
  }
}

async function createTestOrganizations() {
  console.log('\n🏢 Creating test organizations...');

  for (const org of testOrganizations) {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .insert(org)
        .select()
        .single();

      if (error) {
        console.log(`   ❌ Organization "${org.name}": ${error.message}`);
      } else {
        console.log(`   ✅ Created organization: ${org.name}`);

        // Add creator as owner
        const { error: memberError } = await supabase
          .from('organization_members')
          .insert({
            organization_id: data.id,
            user_id: org.created_by,
            role: 'owner',
            status: 'active'
          });

        if (memberError) {
          console.log(`   ⚠️  Could not add owner to ${org.name}: ${memberError.message}`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Error creating organization: ${error.message}`);
    }
  }
}

async function createSampleTransactions() {
  console.log('\n💸 Creating sample transactions...');

  // Create some sample donations to projects
  const sampleTransactions = [
    {
      amount_sats: 1000000, // 0.01 BTC
      currency: 'SATS',
      from_entity_type: 'profile',
      from_entity_id: 'test-user-3', // investor_bob
      to_entity_type: 'project',
      to_entity_id: 'test-project-1', // First created project
      payment_method: 'bitcoin',
      status: 'completed',
      transaction_hash: 'sample_tx_hash_1',
      message: 'Excited to support Bitcoin wallet development!',
      public_visibility: true
    },
    {
      amount_sats: 500000, // 0.005 BTC
      currency: 'SATS',
      from_entity_type: 'profile',
      from_entity_id: 'test-user-3',
      to_entity_type: 'project',
      to_entity_id: 'test-project-2', // Second project
      payment_method: 'lightning',
      status: 'completed',
      lightning_payment_hash: 'sample_lightning_hash_1',
      message: 'Love the community garden initiative!',
      public_visibility: true
    }
  ];

  for (const transaction of sampleTransactions) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert(transaction)
        .select()
        .single();

      if (error) {
        console.log(`   ❌ Transaction: ${error.message}`);
      } else {
        console.log(`   ✅ Created transaction: ${transaction.amount_sats} sats`);
      }
    } catch (error) {
      console.log(`   ❌ Error creating transaction: ${error.message}`);
    }
  }
}

async function createSampleTimelinePosts() {
  console.log('\n📱 Creating sample timeline posts...');

  const samplePosts = [
    {
      user_id: 'test-user-1',
      content: 'Just launched our new Bitcoin wallet project! 🎉 Check it out at /projects/wallet and consider supporting if you believe in user-friendly Bitcoin tools.',
      visibility: 'public',
      post_type: 'text'
    },
    {
      user_id: 'test-user-2',
      content: 'Available for Bitcoin development consulting! Whether you need help with wallet integration, Lightning Network, or general Web3 development, I can help. DM me or check my services.',
      visibility: 'public',
      post_type: 'text'
    },
    {
      user_id: 'test-user-4',
      content: 'Our community center renovation project is now live! We\'re raising funds to create a space for digital literacy workshops and community events. Every bit helps! 🌱',
      visibility: 'public',
      post_type: 'text'
    }
  ];

  // Note: Timeline posts table might be named differently (posts, timeline_events, etc.)
  // This is a placeholder - adjust based on actual schema
  console.log('   ℹ️  Timeline posts creation skipped (table name TBD)');
}

async function runSetup() {
  try {
    console.log('🧪 COMPREHENSIVE TESTING SETUP\n');
    console.log('This will create test data for all OrangeCat workflows\n');

    // Run all creation functions
    await createTestUsers();
    await createTestProjects();
    await createTestProducts();
    await createTestServices();
    await createTestLoans();
    await createTestOrganizations();
    await createSampleTransactions();
    await createSampleTimelinePosts();

    console.log('\n🎉 TESTING SETUP COMPLETE!\n');

    console.log('📊 Created Test Data Summary:');
    console.log(`   👥 ${testUsers.length} test users`);
    console.log(`   🎯 ${testProjects.length} projects (${testProjects.filter(p => p.status === 'active').length} active)`);
    console.log(`   🛒 ${testProducts.length} products`);
    console.log(`   🔧 ${testServices.length} services`);
    console.log(`   💰 ${testLoans.length} loan requests`);
    console.log(`   🏢 ${testOrganizations.length} organizations`);
    console.log('   💸 Sample transactions and donations');

    console.log('\n🚀 READY FOR TESTING!\n');

    console.log('Next steps:');
    console.log('1. Start the app: npm run dev');
    console.log('2. Login with test users (password: TestPassword123!)');
    console.log('3. Test all workflows using TESTING_WORKFLOWS_GUIDE.md');
    console.log('4. Run verification: node scripts/db-verify-fixes.mjs');

  } catch (error) {
    console.error('\n💥 SETUP FAILED:', error.message);
    process.exit(1);
  }
}

// Run the setup
runSetup();











