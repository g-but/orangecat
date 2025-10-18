#!/usr/bin/env node

/**
 * Fix Storage RLS Policies for Avatar Uploads
 * Uses service role to apply RLS policies correctly
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'storage'
  }
})

async function executeSQL(sql, description) {
  console.log(`\n📝 ${description}...`)

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`
    },
    body: JSON.stringify({ query: sql })
  })

  const result = await response.json()

  if (!response.ok) {
    console.error(`   ⚠️  ${result.message || 'Failed'}`)
    return false
  }

  console.log(`   ✅ Success`)
  return true
}

async function fixStorageRLS() {
  console.log('🔧 Fixing Storage RLS Policies for Avatar Uploads\n')
  console.log('=' .repeat(80))

  const statements = [
    {
      sql: `ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;`,
      desc: 'Enable RLS on storage.objects'
    },
    {
      sql: `DROP POLICY IF EXISTS "Users can upload their own profile images" ON storage.objects;`,
      desc: 'Drop old policy 1'
    },
    {
      sql: `DROP POLICY IF EXISTS "Users can update their own profile images" ON storage.objects;`,
      desc: 'Drop old policy 2'
    },
    {
      sql: `DROP POLICY IF EXISTS "Users can delete their own profile images" ON storage.objects;`,
      desc: 'Drop old policy 3'
    },
    {
      sql: `DROP POLICY IF EXISTS "Public profiles bucket is publicly readable" ON storage.objects;`,
      desc: 'Drop old policy 4'
    },
    {
      sql: `DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;`,
      desc: 'Drop old avatar upload policy'
    },
    {
      sql: `DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;`,
      desc: 'Drop old avatar update policy'
    },
    {
      sql: `DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;`,
      desc: 'Drop old avatar delete policy'
    },
    {
      sql: `DROP POLICY IF EXISTS "Public avatars bucket is publicly readable" ON storage.objects;`,
      desc: 'Drop old avatar read policy'
    },
    {
      sql: `
        CREATE POLICY "Users can upload their own avatars"
        ON storage.objects
        FOR INSERT
        TO authenticated
        WITH CHECK (
          bucket_id = 'avatars' AND
          (storage.foldername(name))[1] = auth.uid()::text
        );
      `,
      desc: 'Create INSERT policy for avatars'
    },
    {
      sql: `
        CREATE POLICY "Users can update their own avatars"
        ON storage.objects
        FOR UPDATE
        TO authenticated
        USING (
          bucket_id = 'avatars' AND
          (storage.foldername(name))[1] = auth.uid()::text
        )
        WITH CHECK (
          bucket_id = 'avatars' AND
          (storage.foldername(name))[1] = auth.uid()::text
        );
      `,
      desc: 'Create UPDATE policy for avatars'
    },
    {
      sql: `
        CREATE POLICY "Users can delete their own avatars"
        ON storage.objects
        FOR DELETE
        TO authenticated
        USING (
          bucket_id = 'avatars' AND
          (storage.foldername(name))[1] = auth.uid()::text
        );
      `,
      desc: 'Create DELETE policy for avatars'
    },
    {
      sql: `
        CREATE POLICY "Public avatars bucket is publicly readable"
        ON storage.objects
        FOR SELECT
        TO public
        USING (bucket_id = 'avatars');
      `,
      desc: 'Create SELECT policy for public read'
    }
  ]

  let success = 0
  let failed = 0

  for (const stmt of statements) {
    const result = await executeSQL(stmt.sql, stmt.desc)
    if (result) success++
    else failed++

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  console.log('\n' + '='.repeat(80))
  console.log(`\n✅ Completed: ${success} successful, ${failed} failed`)

  if (failed === 0) {
    console.log('\n🎉 Storage RLS policies fixed successfully!')
    console.log('\nYou can now upload avatars without RLS errors.')
  } else {
    console.log('\n⚠️  Some operations failed. Trying alternative method...')
    return false
  }

  return true
}

// Alternative method using direct SQL execution
async function tryDirectSQL() {
  console.log('\n🔄 Trying direct SQL execution via PostgREST...\n')

  const sql = `
    -- Set role to storage admin
    SET ROLE supabase_storage_admin;

    -- Enable RLS
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

    -- Drop old policies
    DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
    DROP POLICY IF EXISTS "Public avatars bucket is publicly readable" ON storage.objects;

    -- Create new policies
    CREATE POLICY "Users can upload their own avatars"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

    CREATE POLICY "Users can update their own avatars"
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
    WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

    CREATE POLICY "Users can delete their own avatars"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

    CREATE POLICY "Public avatars bucket is publicly readable"
    ON storage.objects FOR SELECT TO public
    USING (bucket_id = 'avatars');

    -- Reset role
    RESET ROLE;
  `

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ query: sql })
    })

    if (response.ok) {
      console.log('✅ Direct SQL execution successful!')
      return true
    }
  } catch (err) {
    console.error('Failed:', err.message)
  }

  return false
}

async function main() {
  const success = await fixStorageRLS()

  if (!success) {
    await tryDirectSQL()
  }
}

main().catch(console.error)
