#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://ohkueislstxomdjavyhs.supabase.co';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🔧 Applying post duplication fix migration...\n');

  const migrationPath = path.join(
    __dirname,
    'supabase/migrations/20251119120000_fix_post_duplication.sql'
  );
  const sql = fs.readFileSync(migrationPath, 'utf8');

  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'));

  console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';

    // Skip comments
    if (statement.startsWith('--')) {
      continue;
    }

    // Extract a preview of the statement for logging
    const preview = statement.substring(0, 80).replace(/\s+/g, ' ').trim();

    console.log(`[${i + 1}/${statements.length}] ${preview}...`);

    try {
      const { data, error } = await supabase.rpc('exec_sql', { query: statement });

      if (error) {
        // Some errors are expected (like "already exists")
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Already exists, skipping\n`);
        } else {
          console.error(`❌ Error: ${error.message}\n`);
          errorCount++;
        }
      } else {
        console.log(`✅ Success\n`);
        successCount++;
      }
    } catch (err) {
      console.error(`❌ Error: ${err.message}\n`);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Completed: ${successCount} successful, ${errorCount} errors`);
  console.log('='.repeat(60) + '\n');

  // Verify the migration
  console.log('🔍 Verifying migration...\n');

  try {
    // Check if post_visibility table exists
    const { data: tables, error: tableError } = await supabase
      .from('post_visibility')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error(`❌ post_visibility table check failed: ${tableError.message}`);
    } else {
      console.log('✅ post_visibility table exists');
    }

    // Check if create_post_with_visibility function exists
    const { data: funcCheck, error: funcError } = await supabase.rpc(
      'create_post_with_visibility',
      {
        p_event_type: 'test',
        p_actor_id: '00000000-0000-0000-0000-000000000000',
        p_subject_type: 'profile',
        p_subject_id: '00000000-0000-0000-0000-000000000000',
        p_title: 'test',
        p_description: null,
        p_visibility: 'public',
        p_metadata: {},
        p_timeline_contexts: '[]',
      }
    );

    if (funcError && !funcError.message.includes('violates foreign key constraint')) {
      console.error(`❌ create_post_with_visibility function check failed: ${funcError.message}`);
    } else {
      console.log('✅ create_post_with_visibility function exists');
    }

    // Check community_timeline_no_duplicates view
    const { data: viewCheck, error: viewError } = await supabase
      .from('community_timeline_no_duplicates')
      .select('*')
      .limit(1);

    if (viewError) {
      console.error(`❌ community_timeline_no_duplicates view check failed: ${viewError.message}`);
    } else {
      console.log('✅ community_timeline_no_duplicates view exists');
    }
  } catch (err) {
    console.error(`❌ Verification error: ${err.message}`);
  }

  console.log('\n✨ Migration complete!\n');
}

applyMigration().catch(console.error);
