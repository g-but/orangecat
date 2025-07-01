const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Use service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixSupabaseSchema() {
  console.log('🔧 Applying schema fixes to Supabase...');
  
  try {
    // Step 1: Add missing columns
    console.log('📝 Adding missing columns to profiles table...');
    
    const addColumnsSQL = `
      ALTER TABLE public.profiles 
      ADD COLUMN IF NOT EXISTS display_name text,
      ADD COLUMN IF NOT EXISTS bio text,
      ADD COLUMN IF NOT EXISTS banner_url text,
      ADD COLUMN IF NOT EXISTS bitcoin_address text,
      ADD COLUMN IF NOT EXISTS lightning_address text;
    `;
    
    const { error: addColumnsError } = await supabase.rpc('exec_sql', {
      sql: addColumnsSQL
    });
    
    if (addColumnsError) {
      console.log('ℹ️  Columns might already exist, trying individual additions...');
      
      // Try adding columns individually
      const columns = [
        'display_name text',
        'bio text', 
        'banner_url text',
        'bitcoin_address text',
        'lightning_address text'
      ];
      
      for (const column of columns) {
        try {
          const { error } = await supabase.rpc('exec_sql', {
            sql: `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ${column};`
          });
          if (!error) {
            console.log(`✅ Added column: ${column.split(' ')[0]}`);
          }
        } catch (err) {
          console.log(`ℹ️  Column ${column.split(' ')[0]} already exists or error:`, err.message);
        }
      }
    } else {
      console.log('✅ All missing columns added successfully');
    }
    
    // Step 2: Update the handle_new_user function
    console.log('📝 Updating handle_new_user function...');
    
    const updateFunctionSQL = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger AS $$
      BEGIN
        INSERT INTO public.profiles (id, username, display_name, created_at, updated_at)
        VALUES (
          new.id,
          split_part(new.email, '@', 1), -- Use email username part as initial username
          split_part(new.email, '@', 1), -- Use email username part as initial display name
          NOW(),
          NOW()
        );
        RETURN new;
      EXCEPTION
        WHEN others THEN
          -- Log the error but don't fail the transaction
          RAISE WARNING 'Error creating profile for user %: %', new.id, SQLERRM;
          RETURN new;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    const { error: functionError } = await supabase.rpc('exec_sql', {
      sql: updateFunctionSQL
    });
    
    if (functionError) {
      console.error('❌ Error updating function:', functionError.message);
    } else {
      console.log('✅ handle_new_user function updated successfully');
    }
    
    // Step 3: Check the current schema
    console.log('🔍 Checking current profiles table schema...');
    
    const { data: columns, error: schemaError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'profiles')
      .eq('table_schema', 'public');
    
    if (schemaError) {
      console.error('❌ Error checking schema:', schemaError.message);
    } else {
      console.log('📋 Current profiles table columns:');
      columns.forEach(col => console.log(`   - ${col.column_name}`));
    }
    
    // Step 4: Test profile operations
    console.log('🧪 Testing profile operations...');
    
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .limit(1);
    
    if (testError) {
      console.error('❌ Error testing profiles:', testError.message);
    } else {
      console.log('✅ Profile operations working correctly');
      if (testData.length > 0) {
        console.log('📋 Sample profile:', testData[0]);
      }
    }
    
    console.log('🎉 Schema fix completed!');
    
  } catch (err) {
    console.error('💥 Script failed:', err);
  }
}

fixSupabaseSchema(); 