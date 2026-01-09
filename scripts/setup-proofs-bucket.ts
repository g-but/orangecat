/**
 * Setup Proofs Storage Bucket
 *
 * Run this script to create the 'proofs' storage bucket in Supabase.
 *
 * Usage: npx tsx scripts/setup-proofs-bucket.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function setupProofsBucket() {
  console.log('🚀 Setting up proofs storage bucket...\n');

  // Check if bucket already exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    console.error('❌ Failed to list buckets:', listError.message);
    process.exit(1);
  }

  const existingBucket = buckets?.find(b => b.id === 'proofs');

  if (existingBucket) {
    console.log('ℹ️  Bucket "proofs" already exists. Updating settings...');

    const { error: updateError } = await supabase.storage.updateBucket('proofs', {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
    });

    if (updateError) {
      console.error('❌ Failed to update bucket:', updateError.message);
      process.exit(1);
    }

    console.log('✅ Bucket "proofs" updated successfully!');
  } else {
    console.log('📦 Creating bucket "proofs"...');

    const { error: createError } = await supabase.storage.createBucket('proofs', {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
    });

    if (createError) {
      console.error('❌ Failed to create bucket:', createError.message);
      process.exit(1);
    }

    console.log('✅ Bucket "proofs" created successfully!');
  }

  console.log('\n📋 Bucket Configuration:');
  console.log('   - Name: proofs');
  console.log('   - Public: true (for transparency)');
  console.log('   - Max file size: 10MB');
  console.log('   - Allowed types: JPEG, PNG, WebP, GIF');

  console.log('\n⚠️  NOTE: Storage policies (RLS) need to be set via Supabase Dashboard.');
  console.log('   Go to: Storage → Policies → proofs bucket');
  console.log(
    '   Or run the SQL in: supabase/migrations/20260109000000_create_proofs_storage_bucket.sql'
  );

  console.log('\n✅ Setup complete!');
}

setupProofsBucket().catch(console.error);
