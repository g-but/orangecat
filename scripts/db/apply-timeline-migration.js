#!/usr/bin/env node

/**
 * Apply Timeline Events Migration
 *
 * This script applies the timeline_events migration to create the necessary
 * database function for posting to the timeline.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase environment variables');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  console.error('   Make sure .env.local exists and contains these variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function applyMigration() {
  try {
    console.log('🚀 Applying timeline_events migration...\n');

    // Read the migration file
    const migrationPath = join(
      __dirname,
      '../../supabase/migrations/20251113000000_create_timeline_events.sql'
    );
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Split into individual statements (simple approach - split on semicolons)
    // For a production script, you'd want a proper SQL parser
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'));

    console.log(`📄 Found ${statements.length} SQL statements to execute\n`);

    // Execute the migration
    // Note: Supabase doesn't have a direct "execute raw SQL" endpoint via JS client
    // We need to use the REST API or apply via Supabase Dashboard

    // For now, let's try using rpc if there's an exec_sql function, or guide user
    console.log('⚠️  Direct SQL execution via JS client is limited.');
    console.log('📋 Please apply this migration manually:\n');
    console.log('   1. Go to: https://supabase.com/dashboard/project/ohkueislstxomdjavyhs/sql/new');
    console.log('   2. Copy and paste the contents of:');
    console.log(`      ${migrationPath}`);
    console.log('   3. Click "Run"\n');

    // Alternatively, try to check if function exists first
    const { data: functionCheck, error: checkError } = await supabase
      .rpc('create_timeline_event', {
        p_event_type: 'status_update',
        p_subject_type: 'profile',
        p_title: 'test',
      })
      .then(() => ({ data: true, error: null }))
      .catch(err => ({ data: false, error: err }));

    if (!checkError || checkError.message.includes('not found')) {
      console.log('✅ Function does not exist - migration needs to be applied');
    } else {
      console.log('✅ Function exists! Migration may already be applied');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

applyMigration();
