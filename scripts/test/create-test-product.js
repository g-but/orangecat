#!/usr/bin/env node

// Create a test product directly in the database
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

// For local development, use the local database
const databaseUrl = process.env.DATABASE_URL || `postgresql://postgres:postgres@localhost:54322/postgres`;

const client = new Client({
  connectionString: databaseUrl,
});

// Create a test product directly in the database
async function createTestProduct() {
  try {
    await client.connect();
    console.log('🎨 Creating test product: "Antique Menorah"...');

    // First, create or get a test user
    const testEmail = 'test@example.com';
    const testPassword = 'testpassword123';

    // Check if user exists in auth.users
    let testUserId;
    try {
      const userResult = await client.query(
        'SELECT id FROM auth.users WHERE email = $1 LIMIT 1',
        [testEmail]
      );

      if (userResult.rows.length > 0) {
        testUserId = userResult.rows[0].id;
        console.log('✅ Found existing test user:', testUserId);
      }
    } catch (e) {
      console.log('Could not query auth.users, will create user directly');
    }

    // Create user if doesn't exist (directly in auth.users)
    if (!testUserId) {
      try {
        const { v4: uuidv4 } = require('uuid');
        testUserId = uuidv4();

        // Note: This is a simplified approach - in real Supabase, auth.users has complex structure
        // For testing, we'll use a known UUID
        testUserId = '550e8400-e29b-41d4-a716-446655440000';
        console.log('⚠️ Using predefined test user ID:', testUserId);

      } catch (e) {
        console.log('Could not create user, using predefined ID');
        testUserId = '550e8400-e29b-41d4-a716-446655440000';
      }
    }

    // Ensure profile exists
    try {
      const profileResult = await client.query(
        'SELECT id FROM profiles WHERE id = $1',
        [testUserId]
      );

      if (profileResult.rows.length === 0) {
        await client.query(
          'INSERT INTO profiles (id, username, full_name, bio, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW())',
          [testUserId, 'testuser', 'Test User', 'Test user for product creation']
        );
        console.log('✅ Created test profile');
      } else {
        console.log('✅ Test profile already exists');
      }
    } catch (e) {
      console.log('Could not check/create profile:', e.message);
    }

    // Temporarily disable RLS for user_products table
    console.log('🔧 Temporarily disabling RLS for user_products table...');
    await client.query('ALTER TABLE user_products DISABLE ROW LEVEL SECURITY');

    // Now create the product
    const productData = {
      user_id: testUserId,
      title: 'Antique Menorah',
      description: 'Beautiful antique menorah from the 19th century, perfect for Hanukkah celebrations. Made of solid brass with intricate engravings.',
      price_sats: 50000,
      category: 'Antiques',
      product_type: 'physical',
      inventory_count: 1,
      fulfillment_type: 'manual',
      status: 'draft'
    };

    const productResult = await client.query(
      `INSERT INTO user_products (user_id, title, description, price_sats, category, product_type, inventory_count, fulfillment_type, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING id, title, category, price_sats`,
      [
        productData.user_id,
        productData.title,
        productData.description,
        productData.price_sats,
        productData.category,
        productData.product_type,
        productData.inventory_count,
        productData.fulfillment_type,
        productData.status
      ]
    );

    if (productResult.rows.length > 0) {
      const product = productResult.rows[0];
      console.log('✅ Product created successfully!');
      console.log('Product ID:', product.id);
      console.log('Title:', product.title);
      console.log('Price:', product.price_sats, 'sats');
      console.log('Category:', product.category);
    } else {
      console.error('❌ Failed to create product: No rows returned');
    }

    // Re-enable RLS
    console.log('🔧 Re-enabling RLS for user_products table...');
    await client.query('ALTER TABLE user_products ENABLE ROW LEVEL SECURITY');

    await client.end();

  } catch (error) {
    console.error('Script failed:', error);
    await client.end();
  }
}

createTestProduct();



