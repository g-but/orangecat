const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQL(sql, description) {
  try {
    // REMOVED: console.log statement
    const { data, error } = await supabase.rpc('exec', { sql });
    if (error) {
      console.error(`   ❌ Error: ${error.message}`);
      return false;
    }
    // REMOVED: console.log statement
    return true;
  } catch (err) {
    console.error(`   ❌ Exception: ${err.message}`);
    return false;
  }
}

async function fixProfilesDirectly() {
  // REMOVED: console.log statement
  // REMOVED: console.log statement
  
  try {
    // Check current schema first
    // REMOVED: console.log statement
    const { data: currentData, error: currentError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (currentError) {
      console.error('❌ Cannot access profiles table:', currentError.message);
      return;
    }
    
    const currentColumns = currentData.length > 0 ? Object.keys(currentData[0]) : [];
    if (process.env.NODE_ENV === 'development') console.log('✅ Current columns:', currentColumns);
    
    // Check what columns are missing
    const expectedColumns = ['display_name', 'bio', 'banner_url', 'bitcoin_address', 'lightning_address'];
    const missingColumns = expectedColumns.filter(col => !currentColumns.includes(col));
    
    // REMOVED: console.log statement
    
    if (missingColumns.length === 0) {
      if (process.env.NODE_ENV === 'development') console.log('✅ All expected columns already exist!');
    } else {
      // REMOVED: console.log statement
      
      // Add columns one by one using direct database operations
      for (const column of missingColumns) {
        // REMOVED: console.log statement
        
        // Use a workaround - try to update a non-existent record to trigger column creation
        const { error } = await supabase
          .from('profiles')
          .update({ [column]: null })
          .eq('id', '00000000-0000-0000-0000-000000000000'); // Non-existent ID
        
        if (error && error.message.includes('does not exist')) {
          // REMOVED: console.log statement
        } else {
          // REMOVED: console.log statement
        }
      }
    }
    
    // Try to update the current user's profile to test functionality
    // REMOVED: console.log statement
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      // REMOVED: console.log statement for security
    } else {
      // REMOVED: console.log statement for security
      
      // Try a simple update with only existing columns
      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({ 
          username: user.email.split('@')[0],
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select('*');
      
      if (updateError) {
        console.error('❌ Profile update failed:', updateError.message);
        
        // Try to create the profile if it doesn't exist
        // REMOVED: console.log statement
        const { data: createData, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username: user.email.split('@')[0],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('*');
        
        if (createError) {
          console.error('   ❌ Profile creation failed:', createError.message);
        } else {
          // REMOVED: console.log statement
        }
      } else {
        if (process.env.NODE_ENV === 'development') console.log('✅ Profile update successful:', updateData);
      }
    }
    
    // Final verification
    // REMOVED: console.log statement
    const { data: finalData, error: finalError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (finalError) {
      console.error('❌ Final verification failed:', finalError.message);
    } else {
      if (process.env.NODE_ENV === 'development') console.log('✅ Final schema:', finalData.length > 0 ? Object.keys(finalData[0]) : 'No data');
    }
    
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
  }
}

fixProfilesDirectly(); 