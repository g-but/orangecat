#!/usr/bin/env node

/**
 * Setup Supabase Storage Buckets for OrangeCat
 * Creates the necessary storage buckets for avatar and banner uploads
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupStorageBuckets() {
  console.log('🪣 Setting up Supabase Storage Buckets...')

  try {
    // Create avatars bucket
    console.log('Creating avatars bucket...')
    const { data: avatarsData, error: avatarsError } = await supabase.storage.createBucket('avatars', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      fileSizeLimit: 5242880, // 5MB
    })

    if (avatarsError && !avatarsError.message.includes('already exists')) {
      console.error('Error creating avatars bucket:', avatarsError)
    } else {
      console.log('✅ Avatars bucket ready')
    }

    // Create banners bucket
    console.log('Creating banners bucket...')
    const { data: bannersData, error: bannersError } = await supabase.storage.createBucket('banners', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      fileSizeLimit: 10485760, // 10MB
    })

    if (bannersError && !bannersError.message.includes('already exists')) {
      console.error('Error creating banners bucket:', bannersError)
    } else {
      console.log('✅ Banners bucket ready')
    }

    // Set up bucket policies
    console.log('Setting up bucket policies...')

    // Avatars bucket policy - Allow INSERT and UPDATE for own folder
    const { error: avatarsInsertPolicyError } = await supabase.rpc('create_policy', {
      table_name: 'objects',
      policy_name: 'Users can upload/update their own avatars',
      definition: `
        (bucket_id = 'avatars'::text) AND 
        (auth.role() = 'authenticated') AND
        (auth.uid()::text = (storage.foldername(name))[1])
      `,
      action: 'INSERT,UPDATE'
    })

    // Public read access for avatars
    const { error: avatarsSelectPolicyError } = await supabase.rpc('create_policy', {
      table_name: 'objects',
      policy_name: 'Avatar images are publicly accessible',
      definition: `bucket_id = 'avatars'::text`,
      action: 'SELECT'
    })

    // Banners bucket policy
    const { error: bannersInsertPolicyError } = await supabase.rpc('create_policy', {
      table_name: 'objects',
      policy_name: 'Users can upload/update their own banners',
      definition: `
        (bucket_id = 'banners'::text) AND 
        (auth.role() = 'authenticated') AND
        (auth.uid()::text = (storage.foldername(name))[1])
      `,
      action: 'INSERT,UPDATE'
    })

    const { error: bannersSelectPolicyError } = await supabase.rpc('create_policy', {
      table_name: 'objects',
      policy_name: 'Banner images are publicly accessible',
      definition: `bucket_id = 'banners'::text`,
      action: 'SELECT'
    })

    console.log('✅ Storage bucket setup complete!')
    console.log('\nBuckets created:')
    console.log('- avatars (5MB limit, public)')
    console.log('- banners (10MB limit, public)')

  } catch (error) {
    console.error('❌ Error setting up storage buckets:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  setupStorageBuckets()
}

module.exports = { setupStorageBuckets }