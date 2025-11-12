#!/usr/bin/env node
/**
 * Fix typos in project descriptions
 *
 * Fixes:
 * - "walet" → "wallet"
 * - "worlld" → "world"
 *
 * Created: 2025-01-07
 * Last Modified: 2025-01-07
 * Last Modified Summary: Created script to fix typos in project descriptions
 *
 * Run with: node scripts/db/fix-project-typos.js
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
const envFiles = ['.env.local', '.env'];
envFiles.forEach(file => {
  const envPath = path.resolve(process.cwd(), file);
  dotenv.config({ path: envPath });
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

// Use service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function fixProjectTypos() {
  console.log('🔍 Searching for projects with typos...\n');

  try {
    // Find projects with typos
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, title, description')
      .or('description.ilike.%walet%,description.ilike.%worlld%');

    if (error) {
      console.error('❌ Error fetching projects:', error);
      process.exit(1);
    }

    if (!projects || projects.length === 0) {
      console.log('✅ No projects with typos found!');
      return;
    }

    console.log(`📝 Found ${projects.length} project(s) with typos:\n`);

    for (const project of projects) {
      console.log(`   - "${project.title}" (${project.id})`);

      let fixedDescription = project.description;
      let hasChanges = false;

      // Fix "walet" → "wallet"
      if (fixedDescription.includes('walet')) {
        fixedDescription = fixedDescription.replace(/walet/gi, 'wallet');
        hasChanges = true;
        console.log('      ✓ Fixed "walet" → "wallet"');
      }

      // Fix "worlld" → "world"
      if (fixedDescription.includes('worlld')) {
        fixedDescription = fixedDescription.replace(/worlld/gi, 'world');
        hasChanges = true;
        console.log('      ✓ Fixed "worlld" → "world"');
      }

      if (hasChanges) {
        // Update the project
        const { error: updateError } = await supabase
          .from('projects')
          .update({
            description: fixedDescription,
            updated_at: new Date().toISOString(),
          })
          .eq('id', project.id);

        if (updateError) {
          console.error(`      ❌ Error updating project ${project.id}:`, updateError);
        } else {
          console.log(`      ✅ Successfully updated project ${project.id}\n`);
        }
      }
    }

    console.log('✅ All typos fixed!');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

fixProjectTypos().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
