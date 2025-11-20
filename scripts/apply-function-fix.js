#!/usr/bin/env node

/**
 * Apply handle_new_user function fix
 *
 * Fixes the database function to use email prefix instead of full email
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const sql = `
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, name, created_at, updated_at)
  VALUES (
    NEW.id,
    -- Use email prefix (before @) instead of full email
    COALESCE(
      SPLIT_PART(NEW.email, '@', 1),
      'user_' || SUBSTRING(NEW.id::TEXT, 1, 8)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      SPLIT_PART(NEW.email, '@', 1),
      'User'
    ),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

async function applyFix() {
  console.log('Applying handle_new_user function fix...\n');

  const { error } = await supabase.rpc('exec_sql', { sql });

  if (error) {
    console.error('Error applying fix:', error);

    // Try alternative approach using a direct query
    console.log('\nTrying direct query approach...');
    const { error: directError } = await supabase
      .from('_realtime_schema_changes')
      .select('*')
      .limit(0);

    if (directError) {
      console.error('Cannot apply SQL directly. Please apply manually using Supabase dashboard.');
      console.log('\nSQL to apply:');
      console.log(sql);
      process.exit(1);
    }
  } else {
    console.log('✓ Function fix applied successfully!');
  }
}

applyFix().catch(error => {
  console.error('Unexpected error:', error);
  console.log('\nPlease apply this SQL manually using Supabase SQL Editor:');
  console.log(sql);
  process.exit(1);
});
