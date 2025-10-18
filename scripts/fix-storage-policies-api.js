#!/usr/bin/env node

/**
 * Fix Storage Bucket Policies using Supabase Management API
 * This approach uses the proper API instead of direct SQL
 */

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const accessToken = process.env.SUPABASE_ACCESS_TOKEN

if (!supabaseUrl || !accessToken) {
  console.error('❌ Missing required environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_ACCESS_TOKEN')
  console.log('\nYou can get your access token from: https://supabase.com/dashboard/account/tokens')
  process.exit(1)
}

// Extract project ref from URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\./)?.[1]

if (!projectRef) {
  console.error('❌ Could not extract project reference from URL')
  process.exit(1)
}

console.log(`🔧 Fixing Storage Policies for project: ${projectRef}\n`)

async function updateBucketPolicies() {
  const managementUrl = `https://api.supabase.com/v1/projects/${projectRef}/storage/buckets/avatars`

  console.log('📝 Updating avatars bucket configuration...\n')

  // Update bucket to be public and set proper policies
  const response = await fetch(managementUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      public: true,
      file_size_limit: 5242880, // 5MB
      allowed_mime_types: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif'
      ]
    })
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('❌ Failed to update bucket:', error)
    return false
  }

  console.log('✅ Bucket configuration updated!\n')
  return true
}

async function createStoragePolicies() {
  console.log('📝 Creating RLS policies via SQL...\n')

  const sql = `
    -- Drop existing policies
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
  `

  const sqlUrl = `https://api.supabase.com/v1/projects/${projectRef}/database/query`

  const response = await fetch(sqlUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({ query: sql })
  })

  if (!response.ok) {
    const error = await response.json()
    console.error('❌ Failed to create policies:', error.message || error)
    console.log('\n⚠️  This requires running SQL manually in the dashboard.')
    return false
  }

  console.log('✅ RLS policies created!\n')
  return true
}

async function main() {
  console.log('=' .repeat(80))
  console.log('FIXING STORAGE RLS POLICIES')
  console.log('=' .repeat(80) + '\n')

  // Step 1: Update bucket configuration
  const bucketSuccess = await updateBucketPolicies()

  // Step 2: Try to create policies via API
  const policySuccess = await createStoragePolicies()

  console.log('=' .repeat(80))

  if (bucketSuccess && policySuccess) {
    console.log('\n🎉 All done! Avatar uploads should now work.\n')
  } else if (bucketSuccess) {
    console.log('\n⚠️  Bucket updated but policies need manual creation.')
    console.log('\nPlease run this SQL in your Supabase dashboard:')
    console.log('https://supabase.com/dashboard/project/' + projectRef + '/sql/new\n')
    console.log('See: apply-storage-fix.sql\n')
  } else {
    console.log('\n⚠️  Could not update via API. Please use the dashboard method.\n')
  }
}

main().catch(console.error)
