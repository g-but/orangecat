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

async function fixProfilesSchema() {
  // REMOVED: console.log statement
  // REMOVED: console.log statement
  // REMOVED: console.log statement
  
  try {
    // Step 1: Add missing columns
    // REMOVED: console.log statement
    
    const addColumnsSQL = `
      ALTER TABLE public.profiles 
      ADD COLUMN IF NOT EXISTS display_name TEXT,
      ADD COLUMN IF NOT EXISTS bio TEXT,
      ADD COLUMN IF NOT EXISTS banner_url TEXT,
      ADD COLUMN IF NOT EXISTS bitcoin_address TEXT,
      ADD COLUMN IF NOT EXISTS lightning_address TEXT;
    `;
    
    const { error: addColumnsError } = await supabase.rpc('exec_sql', {
      sql: addColumnsSQL
    });
    
    if (addColumnsError) {
      console.error('❌ Error adding columns:', addColumnsError.message);
    } else {
      if (process.env.NODE_ENV === 'development') console.log('✅ Missing columns added successfully');
    }
    
    // Step 2: Migrate existing data
    // REMOVED: console.log statement
    
    const migrateDataSQL = `
      UPDATE public.profiles 
      SET display_name = full_name 
      WHERE full_name IS NOT NULL AND display_name IS NULL;
    `;
    
    const { error: migrateError } = await supabase.rpc('exec_sql', {
      sql: migrateDataSQL
    });
    
    if (migrateError) {
      console.error('❌ Error migrating data:', migrateError.message);
    } else {
      if (process.env.NODE_ENV === 'development') console.log('✅ Data migrated from full_name to display_name');
    }
    
    // Step 3: Create indexes
    // REMOVED: console.log statement
    
    const indexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
      CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON public.profiles(display_name);
    `;
    
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: indexesSQL
    });
    
    if (indexError) {
      console.error('❌ Error creating indexes:', indexError.message);
    } else {
      if (process.env.NODE_ENV === 'development') console.log('✅ Performance indexes created');
    }
    
    // Step 4: Update RLS policies
    // REMOVED: console.log statement
    
    const rlsSQL = `
      DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
      CREATE POLICY "Users can view all profiles"
        ON public.profiles FOR SELECT
        USING (true);

      DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
      CREATE POLICY "Users can update their own profile"
        ON public.profiles FOR UPDATE
        USING (auth.uid() = id)
        WITH CHECK (auth.uid() = id);

      DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
      CREATE POLICY "Users can insert their own profile"
        ON public.profiles FOR INSERT
        WITH CHECK (auth.uid() = id);
    `;
    
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: rlsSQL
    });
    
    if (rlsError) {
      console.error('❌ Error updating RLS policies:', rlsError.message);
    } else {
      if (process.env.NODE_ENV === 'development') console.log('✅ RLS policies updated');
    }
    
    // Step 5: Create/update profile update function
    // REMOVED: console.log statement
    
    const functionSQL = `
      CREATE OR REPLACE FUNCTION public.update_profile(profile_data jsonb)
      RETURNS jsonb AS $$
      DECLARE
        result jsonb;
        user_id uuid := auth.uid();
      BEGIN
        -- Check if user is authenticated
        IF user_id IS NULL THEN
          RETURN jsonb_build_object('error', 'User not authenticated');
        END IF;
        
        -- Update the profile with new schema
        UPDATE public.profiles
        SET 
          username = COALESCE((profile_data->>'username')::text, username),
          display_name = COALESCE((profile_data->>'display_name')::text, display_name),
          bio = COALESCE((profile_data->>'bio')::text, bio),
          bitcoin_address = COALESCE((profile_data->>'bitcoin_address')::text, bitcoin_address),
          lightning_address = COALESCE((profile_data->>'lightning_address')::text, lightning_address),
          avatar_url = COALESCE((profile_data->>'avatar_url')::text, avatar_url),
          banner_url = COALESCE((profile_data->>'banner_url')::text, banner_url),
          website = COALESCE((profile_data->>'website')::text, website),
          updated_at = NOW()
        WHERE id = user_id
        RETURNING 
          id, username, display_name, bio, bitcoin_address, lightning_address, 
          avatar_url, banner_url, website, created_at, updated_at
        INTO result;
        
        -- If no profile exists, create one
        IF result IS NULL THEN
          INSERT INTO public.profiles (
            id, username, display_name, bio, bitcoin_address, lightning_address,
            avatar_url, banner_url, website, created_at, updated_at
          ) VALUES (
            user_id,
            (profile_data->>'username')::text,
            (profile_data->>'display_name')::text,
            (profile_data->>'bio')::text,
            (profile_data->>'bitcoin_address')::text,
            (profile_data->>'lightning_address')::text,
            (profile_data->>'avatar_url')::text,
            (profile_data->>'banner_url')::text,
            (profile_data->>'website')::text,
            NOW(),
            NOW()
          )
          RETURNING 
            id, username, display_name, bio, bitcoin_address, lightning_address, 
            avatar_url, banner_url, website, created_at, updated_at
          INTO result;
        END IF;
        
        -- Return the result
        IF result IS NULL THEN
          RETURN jsonb_build_object('error', 'Profile operation failed');
        ELSE
          RETURN jsonb_build_object('success', true, 'data', to_jsonb(result));
        END IF;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      -- Grant execute permission
      GRANT EXECUTE ON FUNCTION public.update_profile(jsonb) TO authenticated;
    `;
    
    const { error: functionError } = await supabase.rpc('exec_sql', {
      sql: functionSQL
    });
    
    if (functionError) {
      console.error('❌ Error creating function:', functionError.message);
    } else {
      if (process.env.NODE_ENV === 'development') console.log('✅ Profile update function created');
    }
    
    // Step 6: Verify the fix
    // REMOVED: console.log statement
    
    const { data: verifyData, error: verifyError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (verifyError) {
      console.error('❌ Verification failed:', verifyError.message);
    } else {
      if (process.env.NODE_ENV === 'development') console.log('✅ Schema verification successful');
      if (verifyData && verifyData.length > 0) {
        // REMOVED: console.log statement
      }
    }
    
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    if (process.env.NODE_ENV === 'development') console.log('✅ Added missing columns: display_name, bio, banner_url, bitcoin_address, lightning_address');
    // REMOVED: console.log statement
    if (process.env.NODE_ENV === 'development') console.log('✅ Updated security policies');
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

fixProfilesSchema(); 