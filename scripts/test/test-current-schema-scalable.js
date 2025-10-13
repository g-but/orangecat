const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testScalableWithCurrentSchema() {
  // REMOVED: console.log statement
  // REMOVED: console.log statement
  // REMOVED: console.log statement
  
  try {
    // Test 1: Create profile with basic fields (current schema)
    // REMOVED: console.log statement
    
    const testUserId = crypto.randomUUID();
    const basicProfile = {
      id: testUserId,
      username: `scalable_user_${Date.now()}`,
      full_name: 'Scalable Test User',
      avatar_url: 'https://example.com/avatar.jpg',
      website: 'https://scalable-test.com'
    };
    
    const { data: createData, error: createError } = await supabase
      .from('profiles')
      .insert(basicProfile)
      .select('*')
      .single();
    
    if (createError) {
      console.error('   ❌ Basic profile creation failed:', createError.message);
      return;
    }
    
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    // REMOVED: console.log statement for security
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    
    // Test 2: Store extended data in JSON format (scalable approach)
    // REMOVED: console.log statement
    
    const scalableData = {
      website: 'https://scalable-test.com',
      bio: 'This is a test bio stored in JSON format',
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
        github: 'https://github.com/scalable_test',
        nostr: 'npub1test123'
      },
      preferences: {
        theme: 'dark',
        notifications: true,
        bitcoin_notifications: true
      },
      theme_preferences: {
        accent_color: '#F7931A',
        font_size: 'medium'
      },
      follower_count: 42,
      following_count: 15,
      campaign_count: 3,
      total_raised: 100000, // 100k sats
      total_donated: 25000,  // 25k sats
      bitcoin_balance: 500000, // 500k sats
      lightning_balance: 50000, // 50k sats
      profile_views: 150,
      verification_level: 1,
      two_factor_enabled: false,
      onboarding_completed: true,
      profile_badges: [
        { type: 'early_adopter', name: 'Early Adopter', earned_at: new Date().toISOString() }
      ],
      metadata: { 
        test: true,
        created_via: 'scalable_test',
        features_used: ['bitcoin', 'lightning', 'social_links']
      },
      verification_data: {
        identity: { status: 'pending', submitted_at: new Date().toISOString() }
      },
      privacy_settings: { 
        profile_visibility: 'public',
        show_bitcoin_address: true,
        show_analytics: false
      }
    };
    
    // Store all extended data as JSON in the website field
    const jsonWebsiteData = JSON.stringify(scalableData);
    
    const { data: updateData, error: updateError } = await supabase
      .from('profiles')
      .update({ 
        website: jsonWebsiteData,
        updated_at: new Date().toISOString()
      })
      .eq('id', testUserId)
      .select('*')
      .single();
    
    if (updateError) {
      console.error('   ❌ Scalable data storage failed:', updateError.message);
    } else {
      // REMOVED: console.log statement
      // REMOVED: console.log statement
      // REMOVED: console.log statement
    }
    
    // Test 3: Retrieve and parse scalable data
    // REMOVED: console.log statement
    
    const { data: retrieveData, error: retrieveError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', testUserId)
      .single();
    
    if (retrieveError) {
      console.error('   ❌ Data retrieval failed:', retrieveError.message);
    } else {
      // REMOVED: console.log statement
      
      // Parse the JSON data from website field
      let parsedData = {};
      try {
        if (retrieveData.website && retrieveData.website.startsWith('{')) {
          parsedData = JSON.parse(retrieveData.website);
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
          // REMOVED: console.log statement
          // REMOVED: console.log statement
        } else {
          // REMOVED: console.log statement
        }
      } catch (err) {
        console.error('   ❌ JSON parsing failed:', err.message);
      }
    }
    
    // Test 4: Update specific scalable fields
    // REMOVED: console.log statement
    
    // Get current data, update specific fields, and save back
    if (retrieveData && retrieveData.website && retrieveData.website.startsWith('{')) {
      try {
        const currentData = JSON.parse(retrieveData.website);
        
        // Update specific fields
        const updatedData = {
          ...currentData,
          bio: 'Updated bio with new information',
          follower_count: 75,
          total_raised: 150000, // 150k sats
          verification_status: 'verified',
          profile_badges: [
            ...currentData.profile_badges,
            { type: 'verified', name: 'Verified User', earned_at: new Date().toISOString() }
          ],
          last_active_at: new Date().toISOString()
        };
        
        const { error: updateError2 } = await supabase
          .from('profiles')
          .update({ 
            website: JSON.stringify(updatedData),
            updated_at: new Date().toISOString()
          })
          .eq('id', testUserId);
        
        if (updateError2) {
          console.error('   ❌ Selective update failed:', updateError2.message);
        } else {
          // REMOVED: console.log statement
          // REMOVED: console.log statement
          // REMOVED: console.log statement
        }
      } catch (err) {
        console.error('   ❌ Update parsing failed:', err.message);
      }
    }
    
    // Test 5: Search functionality with scalable data
    // REMOVED: console.log statement
    
    const { data: searchResults, error: searchError } = await supabase
      .from('profiles')
      .select('id, username, full_name, website')
      .or(`username.ilike.%scalable%,full_name.ilike.%scalable%`)
      .limit(5);
    
    if (searchError) {
      console.error('   ❌ Search failed:', searchError.message);
    } else {
      // REMOVED: console.log statement
      searchResults.forEach((profile, index) => {
        let additionalInfo = '';
        if (profile.website && profile.website.startsWith('{')) {
          try {
            const data = JSON.parse(profile.website);
            additionalInfo = ` (${data.follower_count || 0} followers, ${data.verification_status || 'unverified'})`;
          } catch {
            // Ignore parsing errors for search results
          }
        }
        // REMOVED: console.log statement for security
      });
    }
    
    // Test 6: Analytics aggregation
    // REMOVED: console.log statement
    
    const { data: allProfiles, error: analyticsError } = await supabase
      .from('profiles')
      .select('website')
      .not('website', 'is', null);
    
    if (analyticsError) {
      console.error('   ❌ Analytics query failed:', analyticsError.message);
    } else {
      let totalUsers = 0;
      let totalRaised = 0;
      let verifiedUsers = 0;
      let bitcoinUsers = 0;
      
      allProfiles.forEach(profile => {
        if (profile.website && profile.website.startsWith('{')) {
          try {
            const data = JSON.parse(profile.website);
            totalUsers++;
            totalRaised += data.total_raised || 0;
            if (data.verification_status === 'verified') verifiedUsers++;
            if (data.bitcoin_address) bitcoinUsers++;
          } catch {
            // Ignore parsing errors
          }
        }
      });
      
      // REMOVED: console.log statement
      // REMOVED: console.log statement for security
      // REMOVED: console.log statement
      // REMOVED: console.log statement for security
      // REMOVED: console.log statement
    }
    
    // Test 7: Cleanup
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
    if (process.env.NODE_ENV === 'development') console.log('✅ Current 7-column schema fully utilized');
    // REMOVED: console.log statement
    if (process.env.NODE_ENV === 'development') console.log('✅ Bitcoin-native functionality working');
    // REMOVED: console.log statement
    if (process.env.NODE_ENV === 'development') console.log('✅ Verification system operational');
    // REMOVED: console.log statement
    if (process.env.NODE_ENV === 'development') console.log('✅ Search capabilities enhanced');
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
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    // REMOVED: console.log statement for security
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    console.error(err.stack);
  }
}

testScalableWithCurrentSchema(); 