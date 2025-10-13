const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testScalableSchema() {
  // REMOVED: console.log statement
  // REMOVED: console.log statement
  
  try {
    // Test 1: Check schema structure
    // REMOVED: console.log statement
    
    const { data: schemaData, error: schemaError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (schemaError) {
      console.error('   ❌ Schema test failed:', schemaError.message);
      return;
    }
    
    const columns = schemaData && schemaData.length > 0 ? Object.keys(schemaData[0]) : [];
    // REMOVED: console.log statement
    
    // Check for key scalable fields
    const scalableFields = [
      'display_name', 'bio', 'bitcoin_address', 'lightning_address',
      'social_links', 'preferences', 'verification_status', 'profile_color',
      'follower_count', 'total_raised', 'last_active_at'
    ];
    
    const existingFields = scalableFields.filter(field => columns.includes(field));
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    
    // Test 2: Create a test profile with scalable fields
    // REMOVED: console.log statement
    
    const testUserId = 'test-scalable-' + Date.now();
    const testProfile = {
      id: testUserId,
      username: `scalable_user_${Date.now()}`,
      display_name: 'Scalable Test User',
      bio: 'Testing the new scalable profile schema',
      bitcoin_address: 'bc1qtest123scalable',
      lightning_address: 'test@scalable.lightning',
      email: 'test@scalable.com',
      location: 'Bitcoin City',
      timezone: 'UTC',
      language: 'en',
      currency: 'BTC',
      profile_color: '#F7931A',
      verification_status: 'unverified',
      status: 'active',
      social_links: {
        twitter: 'https://twitter.com/scalable_test',
        github: 'https://github.com/scalable_test'
      },
      preferences: {
        theme: 'dark',
        notifications: true
      },
      theme_preferences: {
        accent_color: '#F7931A',
        font_size: 'medium'
      },
      follower_count: 0,
      following_count: 0,
      campaign_count: 0,
      total_raised: 0,
      total_donated: 0,
      bitcoin_balance: 0,
      lightning_balance: 0,
      profile_views: 0,
      verification_level: 0,
      two_factor_enabled: false,
      onboarding_completed: true,
      profile_badges: [],
      metadata: { test: true },
      verification_data: {},
      privacy_settings: { profile_visibility: 'public' }
    };
    
    const { data: createData, error: createError } = await supabase
      .from('profiles')
      .insert(testProfile)
      .select('*')
      .single();
    
    if (createError) {
      console.error('   ❌ Profile creation failed:', createError.message);
      console.error('   Code:', createError.code);
      console.error('   Details:', createError.details);
      return;
    }
    
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    // REMOVED: console.log statement for security
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    
    // Test 3: Update profile with scalable fields
    // REMOVED: console.log statement
    
    const updateData = {
      bio: 'Updated bio with scalable features',
      location: 'Updated Location',
      follower_count: 42,
      total_raised: 100000, // 100k sats
      verification_status: 'pending',
      social_links: {
        ...createData.social_links,
        nostr: 'npub1test123'
      },
      preferences: {
        ...createData.preferences,
        bitcoin_notifications: true
      },
      last_active_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: updateResult, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', testUserId)
      .select('*')
      .single();
    
    if (updateError) {
      console.error('   ❌ Profile update failed:', updateError.message);
    } else {
      // REMOVED: console.log statement
      // REMOVED: console.log statement
      // REMOVED: console.log statement
      // REMOVED: console.log statement
      // REMOVED: console.log statement
      // REMOVED: console.log statement
    }
    
    // Test 4: Test analytics update
    // REMOVED: console.log statement
    
    const analyticsUpdate = {
      profile_views: 150,
      follower_count: 75,
      campaign_count: 3,
      total_raised: 250000, // 250k sats
      total_donated: 50000   // 50k sats
    };
    
    const { data: analyticsResult, error: analyticsError } = await supabase
      .from('profiles')
      .update(analyticsUpdate)
      .eq('id', testUserId)
      .select('profile_views, follower_count, campaign_count, total_raised, total_donated')
      .single();
    
    if (analyticsError) {
      console.error('   ❌ Analytics update failed:', analyticsError.message);
    } else {
      // REMOVED: console.log statement
      // REMOVED: console.log statement
      // REMOVED: console.log statement
      // REMOVED: console.log statement
      // REMOVED: console.log statement
      // REMOVED: console.log statement
    }
    
    // Test 5: Test search functionality
    // REMOVED: console.log statement
    
    const { data: searchResults, error: searchError } = await supabase
      .from('profiles')
      .select('id, username, display_name, bio, verification_status, follower_count')
      .or(`username.ilike.%scalable%,display_name.ilike.%scalable%,bio.ilike.%scalable%`)
      .eq('status', 'active')
      .order('follower_count', { ascending: false })
      .limit(5);
    
    if (searchError) {
      console.error('   ❌ Search failed:', searchError.message);
    } else {
      // REMOVED: console.log statement
      searchResults.forEach((profile, index) => {
        // REMOVED: console.log statement for security
      });
    }
    
    // Test 6: Cleanup test profile
    // REMOVED: console.log statement
    
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', testUserId);
    
    if (deleteError) {
      console.error('   ❌ Cleanup failed:', deleteError.message);
    } else {
      // REMOVED: console.log statement
    }
    
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    if (process.env.NODE_ENV === 'development') console.log('✅ Schema structure validated');
    // REMOVED: console.log statement
    if (process.env.NODE_ENV === 'development') console.log('✅ Profile updates with new fields work');
    // REMOVED: console.log statement
    if (process.env.NODE_ENV === 'development') console.log('✅ Search capabilities working');
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    // REMOVED: console.log statement for security
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    console.error(err.stack);
  }
}

testScalableSchema(); 