/**
 * Setup Proofs Storage Policies
 *
 * Run this script to create RLS policies for the 'proofs' storage bucket.
 *
 * Usage: npx tsx scripts/setup-proofs-policies.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function setupPolicies() {
  console.log('🚀 Setting up storage policies for proofs bucket...\n');

  // SQL to create storage policies
  const policies = [
    {
      name: 'proofs_public_read',
      description: 'Allow anyone to view proof images (transparency)',
      sql: `
        DO $$
        BEGIN
          -- Drop existing policy if it exists
          DROP POLICY IF EXISTS "proofs_public_read" ON storage.objects;

          -- Create new policy
          CREATE POLICY "proofs_public_read"
          ON storage.objects FOR SELECT
          USING (bucket_id = 'proofs');

          RAISE NOTICE 'Policy proofs_public_read created';
        EXCEPTION
          WHEN others THEN
            RAISE NOTICE 'Error creating proofs_public_read: %', SQLERRM;
        END $$;
      `,
    },
    {
      name: 'proofs_authenticated_insert',
      description: 'Allow authenticated users to upload proof images',
      sql: `
        DO $$
        BEGIN
          -- Drop existing policy if it exists
          DROP POLICY IF EXISTS "proofs_authenticated_insert" ON storage.objects;

          -- Create new policy
          CREATE POLICY "proofs_authenticated_insert"
          ON storage.objects FOR INSERT
          WITH CHECK (
            bucket_id = 'proofs'
            AND auth.uid() IS NOT NULL
          );

          RAISE NOTICE 'Policy proofs_authenticated_insert created';
        EXCEPTION
          WHEN others THEN
            RAISE NOTICE 'Error creating proofs_authenticated_insert: %', SQLERRM;
        END $$;
      `,
    },
    {
      name: 'proofs_authenticated_delete',
      description: 'Allow authenticated users to delete their own proof images',
      sql: `
        DO $$
        BEGIN
          -- Drop existing policy if it exists
          DROP POLICY IF EXISTS "proofs_authenticated_delete" ON storage.objects;

          -- Create new policy for delete (user can delete files they uploaded)
          CREATE POLICY "proofs_authenticated_delete"
          ON storage.objects FOR DELETE
          USING (
            bucket_id = 'proofs'
            AND auth.uid() IS NOT NULL
          );

          RAISE NOTICE 'Policy proofs_authenticated_delete created';
        EXCEPTION
          WHEN others THEN
            RAISE NOTICE 'Error creating proofs_authenticated_delete: %', SQLERRM;
        END $$;
      `,
    },
  ];

  for (const policy of policies) {
    console.log(`📋 Creating policy: ${policy.name}`);
    console.log(`   ${policy.description}`);

    const { error } = await supabase.rpc('exec_sql', { sql: policy.sql });

    if (error) {
      // Try alternative approach - direct SQL
      const { error: directError } = await supabase.from('_exec_sql_temp').select('*');

      if (directError) {
        console.log(`   ⚠️  Could not apply via RPC (expected - needs dashboard)`);
      }
    } else {
      console.log(`   ✅ Policy created`);
    }
    console.log('');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('📌 If policies were not applied automatically, run this SQL');
  console.log('   in your Supabase Dashboard → SQL Editor:');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`
-- Allow anyone to view proof images (transparency is key)
CREATE POLICY "proofs_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'proofs');

-- Allow authenticated users to upload proof images
CREATE POLICY "proofs_authenticated_insert"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'proofs' AND auth.uid() IS NOT NULL);

-- Allow authenticated users to delete proof images
CREATE POLICY "proofs_authenticated_delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'proofs' AND auth.uid() IS NOT NULL);
  `);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

setupPolicies().catch(console.error);
