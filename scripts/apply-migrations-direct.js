const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables!');
  process.exit(1);
}

// Use service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSql(sql, description) {
  console.log(`📝 ${description}...`);
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ sql })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ Error: ${error}`);
      return false;
    }
    
    console.log(`✅ ${description} completed successfully`);
    return true;
  } catch (err) {
    console.error(`❌ Error executing SQL: ${err.message}`);
    return false;
  }
}

async function applyMigrations() {
  console.log('🔧 Applying database migrations directly...');
  
  try {
    // Check if we can connect
    const { data: healthCheck, error: healthError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (healthError) {
      console.error('❌ Database connection failed:', healthError.message);
      return;
    }
    
    console.log('✅ Database connection successful');
    
    // Method 1: Try to add columns one by one using ALTER TABLE
    console.log('\n📝 Adding missing profile columns...');
    
    const columns = [
      'display_name text',
      'bio text',
      'banner_url text',
      'bitcoin_address text',
      'lightning_address text'
    ];
    
    for (const column of columns) {
      const [columnName] = column.split(' ');
      
      // Check if column exists first
      const { data: columnCheck, error: columnError } = await supabase
        .from('profiles')
        .select(columnName)
        .limit(1);
      
      if (columnError && columnError.message.includes(columnName)) {
        console.log(`➕ Adding ${columnName} column...`);
        
        // Try to add the column via direct SQL execution
        const alterSql = `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ${column}`;
        const success = await executeSql(alterSql, `Adding ${columnName} column`);
        
        if (!success) {
          console.log(`⚠️  Could not add ${columnName} column programmatically`);
        }
      } else {
        console.log(`✅ ${columnName} column already exists`);
      }
    }
    
    // Method 2: Create organizations table using direct table creation
    console.log('\n📝 Creating organizations table...');
    
    const { data: orgsCheck, error: orgsError } = await supabase
      .from('organizations')
      .select('id')
      .limit(1);
    
    if (orgsError && orgsError.message.includes('relation "organizations" does not exist')) {
      console.log('➕ Creating organizations table...');
      
      const createOrgsSql = `
        CREATE TABLE public.organizations (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
          name text NOT NULL,
          slug text NOT NULL UNIQUE,
          description text,
          website_url text,
          avatar_url text,
          banner_url text,
          type text NOT NULL DEFAULT 'community',
          category text,
          tags text[] DEFAULT '{}',
          governance_model text NOT NULL DEFAULT 'hierarchical',
          treasury_address text,
          is_public boolean DEFAULT true,
          requires_approval boolean DEFAULT true,
          verification_level integer DEFAULT 0,
          trust_score integer DEFAULT 0,
          settings jsonb DEFAULT '{}',
          contact_info jsonb DEFAULT '{}',
          founded_at timestamp with time zone DEFAULT NOW(),
          created_at timestamp with time zone DEFAULT NOW(),
          updated_at timestamp with time zone DEFAULT NOW()
        );
      `;
      
      await executeSql(createOrgsSql, 'Creating organizations table');
    } else {
      console.log('✅ Organizations table already exists');
    }
    
    // Method 3: Create memberships table
    console.log('\n📝 Creating memberships table...');
    
    const { data: membersCheck, error: membersError } = await supabase
      .from('memberships')
      .select('id')
      .limit(1);
    
    if (membersError && membersError.message.includes('relation "memberships" does not exist')) {
      console.log('➕ Creating memberships table...');
      
      const createMembersSql = `
        CREATE TABLE public.memberships (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
          profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
          role text NOT NULL DEFAULT 'member',
          permissions jsonb DEFAULT '{}',
          title text,
          status text NOT NULL DEFAULT 'active',
          joined_at timestamp with time zone DEFAULT NOW(),
          last_active_at timestamp with time zone DEFAULT NOW(),
          contribution_address text,
          total_contributions integer DEFAULT 0,
          reward_percentage integer DEFAULT 0,
          invited_by uuid REFERENCES public.profiles(id),
          invitation_token text,
          invitation_expires_at timestamp with time zone,
          bio text,
          achievements jsonb DEFAULT '[]',
          metadata jsonb DEFAULT '{}',
          created_at timestamp with time zone DEFAULT NOW(),
          updated_at timestamp with time zone DEFAULT NOW(),
          UNIQUE(organization_id, profile_id)
        );
      `;
      
      await executeSql(createMembersSql, 'Creating memberships table');
    } else {
      console.log('✅ Memberships table already exists');
    }
    
    // Method 4: Create storage buckets manually
    console.log('\n📝 Creating storage buckets...');
    
    // Try to create avatars bucket
    const { data: avatarsBucket, error: avatarsError } = await supabase
      .storage
      .createBucket('avatars', { public: true });
    
    if (avatarsError && !avatarsError.message.includes('already exists')) {
      console.error('❌ Error creating avatars bucket:', avatarsError.message);
    } else {
      console.log('✅ Avatars bucket ready');
    }
    
    // Try to create banners bucket
    const { data: bannersBucket, error: bannersError } = await supabase
      .storage
      .createBucket('banners', { public: true });
    
    if (bannersError && !bannersError.message.includes('already exists')) {
      console.error('❌ Error creating banners bucket:', bannersError.message);
    } else {
      console.log('✅ Banners bucket ready');
    }
    
    console.log('\n🎉 Migration process completed!');
    console.log('Note: Some changes may require manual application via Supabase dashboard if programmatic access is limited.');
    
  } catch (err) {
    console.error('💥 Migration failed:', err);
  }
}

applyMigrations();