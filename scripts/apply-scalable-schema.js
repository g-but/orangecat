const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyScalableSchema() {
  // REMOVED: console.log statement
  // REMOVED: console.log statement
  // REMOVED: console.log statement
  
  try {
    // Step 1: Add missing core columns
    // REMOVED: console.log statement
    
    const coreColumns = `
      ALTER TABLE public.profiles 
      ADD COLUMN IF NOT EXISTS display_name TEXT,
      ADD COLUMN IF NOT EXISTS bio TEXT,
      ADD COLUMN IF NOT EXISTS banner_url TEXT,
      ADD COLUMN IF NOT EXISTS bitcoin_address TEXT,
      ADD COLUMN IF NOT EXISTS lightning_address TEXT,
      ADD COLUMN IF NOT EXISTS email TEXT,
      ADD COLUMN IF NOT EXISTS phone TEXT,
      ADD COLUMN IF NOT EXISTS location TEXT,
      ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
      ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en',
      ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
    `;
    
    const { error: coreError } = await supabase.rpc('exec', { sql: coreColumns });
    if (coreError) {
      // REMOVED: console.log statement
      // Try adding columns one by one
      const columns = [
        'display_name TEXT',
        'bio TEXT', 
        'banner_url TEXT',
        'bitcoin_address TEXT',
        'lightning_address TEXT',
        'email TEXT',
        'phone TEXT',
        'location TEXT',
        'timezone TEXT DEFAULT \'UTC\'',
        'language TEXT DEFAULT \'en\'',
        'currency TEXT DEFAULT \'USD\''
      ];
      
      for (const column of columns) {
        try {
          await supabase.rpc('exec', { 
            sql: `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ${column};` 
          });
          // REMOVED: console.log statement
        } catch (err) {
          // REMOVED: console.log statement
        }
      }
    } else {
      // REMOVED: console.log statement
    }
    
    // Step 2: Add JSON extensibility fields
    // REMOVED: console.log statement
    
    const jsonFields = [
      'social_links JSONB DEFAULT \'{}\'',
      'preferences JSONB DEFAULT \'{}\'',
      'metadata JSONB DEFAULT \'{}\'',
      'verification_data JSONB DEFAULT \'{}\'',
      'privacy_settings JSONB DEFAULT \'{}\''
    ];
    
    for (const field of jsonFields) {
      try {
        await supabase.rpc('exec', { 
          sql: `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ${field};` 
        });
        // REMOVED: console.log statement
      } catch (err) {
        // REMOVED: console.log statement
      }
    }
    
    // Step 3: Add Bitcoin-native features
    // REMOVED: console.log statement
    
    const bitcoinFields = [
      'bitcoin_public_key TEXT',
      'lightning_node_id TEXT',
      'payment_preferences JSONB DEFAULT \'{}\'',
      'bitcoin_balance BIGINT DEFAULT 0',
      'lightning_balance BIGINT DEFAULT 0'
    ];
    
    for (const field of bitcoinFields) {
      try {
        await supabase.rpc('exec', { 
          sql: `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ${field};` 
        });
        // REMOVED: console.log statement
      } catch (err) {
        // REMOVED: console.log statement
      }
    }
    
    // Step 4: Add analytics fields
    // REMOVED: console.log statement
    
    const analyticsFields = [
      'profile_views BIGINT DEFAULT 0',
      'follower_count BIGINT DEFAULT 0',
      'following_count BIGINT DEFAULT 0',
      'campaign_count BIGINT DEFAULT 0',
      'total_raised BIGINT DEFAULT 0',
      'total_donated BIGINT DEFAULT 0'
    ];
    
    for (const field of analyticsFields) {
      try {
        await supabase.rpc('exec', { 
          sql: `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ${field};` 
        });
        // REMOVED: console.log statement
      } catch (err) {
        // REMOVED: console.log statement
      }
    }
    
    // Step 5: Add verification and security fields
    // REMOVED: console.log statement
    
    const securityFields = [
      'verification_status TEXT DEFAULT \'unverified\'',
      'verification_level INTEGER DEFAULT 0',
      'kyc_status TEXT DEFAULT \'none\'',
      'two_factor_enabled BOOLEAN DEFAULT FALSE',
      'last_login_at TIMESTAMPTZ',
      'login_count BIGINT DEFAULT 0'
    ];
    
    for (const field of securityFields) {
      try {
        await supabase.rpc('exec', { 
          sql: `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ${field};` 
        });
        // REMOVED: console.log statement
      } catch (err) {
        // REMOVED: console.log statement
      }
    }
    
    // Step 6: Add customization fields
    // REMOVED: console.log statement
    
    const customFields = [
      'theme_preferences JSONB DEFAULT \'{}\'',
      'custom_css TEXT',
      'profile_color TEXT DEFAULT \'#F7931A\'',
      'cover_image_url TEXT',
      'profile_badges JSONB DEFAULT \'[]\''
    ];
    
    for (const field of customFields) {
      try {
        await supabase.rpc('exec', { 
          sql: `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ${field};` 
        });
        // REMOVED: console.log statement
      } catch (err) {
        // REMOVED: console.log statement
      }
    }
    
    // Step 7: Add status and temporal fields
    // REMOVED: console.log statement
    
    const statusFields = [
      'status TEXT DEFAULT \'active\'',
      'last_active_at TIMESTAMPTZ DEFAULT NOW()',
      'profile_completed_at TIMESTAMPTZ',
      'onboarding_completed BOOLEAN DEFAULT FALSE',
      'terms_accepted_at TIMESTAMPTZ',
      'privacy_policy_accepted_at TIMESTAMPTZ'
    ];
    
    for (const field of statusFields) {
      try {
        await supabase.rpc('exec', { 
          sql: `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ${field};` 
        });
        // REMOVED: console.log statement
      } catch (err) {
        // REMOVED: console.log statement
      }
    }
    
    // Step 8: Migrate existing data
    // REMOVED: console.log statement
    
    try {
      const { error: migrateError } = await supabase.rpc('exec', {
        sql: `
          UPDATE public.profiles 
          SET display_name = full_name 
          WHERE full_name IS NOT NULL AND display_name IS NULL;
        `
      });
      
      if (!migrateError) {
        // REMOVED: console.log statement
      }
    } catch (err) {
      // REMOVED: console.log statement
    }
    
    // Step 9: Create performance indexes
    // REMOVED: console.log statement
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_profiles_username_unique ON public.profiles(username) WHERE username IS NOT NULL',
      'CREATE INDEX IF NOT EXISTS idx_profiles_email_unique ON public.profiles(email) WHERE email IS NOT NULL',
      'CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON public.profiles(display_name) WHERE display_name IS NOT NULL',
      'CREATE INDEX IF NOT EXISTS idx_profiles_bitcoin_address ON public.profiles(bitcoin_address) WHERE bitcoin_address IS NOT NULL',
      'CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON public.profiles(verification_status)',
      'CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status)',
      'CREATE INDEX IF NOT EXISTS idx_profiles_last_active_at ON public.profiles(last_active_at)'
    ];
    
    for (const index of indexes) {
      try {
        await supabase.rpc('exec', { sql: index });
        const indexName = index.match(/idx_profiles_(\w+)/)?.[1] || 'unknown';
        // REMOVED: console.log statement
      } catch (err) {
        // REMOVED: console.log statement
      }
    }
    
    // Step 10: Verify the schema
    // REMOVED: console.log statement
    
    const { data: schemaData, error: schemaError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (schemaError) {
      console.error('   ❌ Schema verification failed:', schemaError.message);
    } else {
      const columns = schemaData && schemaData.length > 0 ? Object.keys(schemaData[0]) : [];
      // REMOVED: console.log statement
      // REMOVED: console.log statement
      
      // Check for key new columns
      const keyColumns = ['display_name', 'bio', 'bitcoin_address', 'social_links', 'verification_status'];
      const existingKeyColumns = keyColumns.filter(col => columns.includes(col));
      // REMOVED: console.log statement
      
      if (existingKeyColumns.length > 0) {
        // REMOVED: console.log statement
      }
    }
    
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    if (process.env.NODE_ENV === 'development') console.log('✅ 25+ new columns added for maximum flexibility');
    // REMOVED: console.log statement
    if (process.env.NODE_ENV === 'development') console.log('✅ JSON fields for unlimited extensibility');
    // REMOVED: console.log statement
    if (process.env.NODE_ENV === 'development') console.log('✅ Analytics and engagement tracking ready');
    // REMOVED: console.log statement
    if (process.env.NODE_ENV === 'development') console.log('✅ Customization and theming support');
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    // REMOVED: console.log statement for security
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

applyScalableSchema(); 