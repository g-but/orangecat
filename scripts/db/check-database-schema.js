const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseSchema() {
  // REMOVED: console.log statement
  // REMOVED: console.log statement
  // REMOVED: console.log statement
  // REMOVED: console.log statement
  
  try {
    // Check what tables exist using raw SQL
    // REMOVED: console.log statement
    const { data: tables, error: tablesError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `
    });
    
    if (tablesError) {
      // Fallback: try to check specific tables directly
      // REMOVED: console.log statement
      
      const tablesToCheck = [
        'profiles', 'funding_pages', 'transactions', 
        'profile_associations', 'organizations', 'memberships'
      ];
      
      const existingTables = [];
      for (const tableName of tablesToCheck) {
        try {
          const { error } = await supabase.from(tableName).select('*').limit(1);
          if (!error) {
            existingTables.push(tableName);
          }
        } catch (e) {
          // Table doesn't exist
        }
      }
      
      if (process.env.NODE_ENV === 'development') console.log('✅ Found tables by direct check:');
      existingTables.forEach(table => {
        // REMOVED: console.log statement
      });
      
      // Check if association system tables exist
      const associationTables = ['profile_associations', 'organizations', 'memberships'];
      const existingAssociationTables = existingTables.filter(t => 
        associationTables.includes(t)
      );
      
      // REMOVED: console.log statement
      if (existingAssociationTables.length === 0) {
        // REMOVED: console.log statement
      }
      
    } else {
      if (process.env.NODE_ENV === 'development') console.log('✅ Found tables:');
      tables.forEach(table => {
        // REMOVED: console.log statement
      });
    }
    
    // Check user data in auth.users
    // REMOVED: console.log statement for security
    try {
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      if (authError) {
        console.error('❌ Error checking auth users:', authError.message);
      } else {
        // REMOVED: console.log statement for security
        authUsers.users.forEach((user, index) => {
          // REMOVED: console.log statement for security
        });
      }
    } catch (err) {
      console.error('❌ Error accessing auth.users:', err.message);
    }
    
    // Check profiles table
    // REMOVED: console.log statement
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, display_name, created_at')
      .order('created_at');
    
    if (profilesError) {
      console.error('❌ Error checking profiles:', profilesError.message);
    } else {
      if (process.env.NODE_ENV === 'development') console.log(`✅ Found ${profiles.length} profiles:`);
      profiles.forEach((profile, index) => {
        // REMOVED: console.log statement for security
      });
    }
    
    // Check funding_pages table
    // REMOVED: console.log statement
    const { data: campaigns, error: campaignsError } = await supabase
      .from('funding_pages')
      .select('id, title, user_id, created_at')
      .order('created_at');
    
    if (campaignsError) {
      console.error('❌ Error checking campaigns:', campaignsError.message);
    } else {
      if (process.env.NODE_ENV === 'development') console.log(`✅ Found ${campaigns.length} campaigns:`);
      campaigns.forEach((campaign, index) => {
        // REMOVED: console.log statement for security
      });
    }
    
    // Summary and recommendations
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    // REMOVED: console.log statement for security
    
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    
    // REMOVED: console.log statement
    // REMOVED: console.log statement for security
    // REMOVED: console.log statement
    
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    
  } catch (err) {
    console.error('❌ Investigation failed:', err.message);
  }
}

checkDatabaseSchema(); 