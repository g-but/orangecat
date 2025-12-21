#!/usr/bin/env node

/**
 * Add a test product to the database
 */

const { createClient } = require('@supabase/supabase-js');

// Get credentials from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing Supabase credentials in environment');
  console.error('Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function addTestProduct() {
  console.log('🛍️ Adding test product to database...\n');

  try {
    // First ensure the test user exists
    console.log('👤 Ensuring test user exists...');
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .upsert({
        id: '550e8400-e29b-41d4-a716-446655440000',
        username: 'testuser2',
        name: 'Test User',
        bio: 'Test user for local development',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select();

    if (userError) {
      console.log('⚠️ User creation failed:', userError.message);
    } else {
      console.log('✅ Test user ready:', user[0]?.username);
    }

    // Add test product
    console.log('\n📦 Adding test product...');
    const { data: product, error: productError } = await supabase
      .from('user_products')
      .insert({
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Handmade Ceramic Mug',
        description: 'Beautiful handcrafted ceramic mug perfect for your morning coffee. Made with high-quality clay and glazed for durability. Each mug is unique and made with care.',
        price_sats: 2500,
        currency: 'SATS',
        product_type: 'physical',
        inventory_count: -1,
        fulfillment_type: 'manual',
        category: 'Handmade',
        tags: ['ceramic', 'mug', 'handmade', 'coffee'],
        status: 'active',
        is_featured: false,
      })
      .select();

    if (productError) {
      console.log('⚠️ Product creation failed:', productError.message);
    } else {
      console.log('✅ Added product:', product[0]?.title);
      console.log('   Price:', product[0]?.price_sats, 'sats');
      console.log('   Type:', product[0]?.product_type);
      console.log('   Status:', product[0]?.status);
    }

    console.log('\n🎉 Test product added successfully!');
    console.log('\n🔍 Check your products at: http://localhost:3000/dashboard/store');

  } catch (error) {
    console.error('❌ Error adding test product:', error);
  }
}

// Run the script
addTestProduct();



