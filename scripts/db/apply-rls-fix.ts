#!/usr/bin/env tsx
/**
 * Apply RLS Fix Migration
 * 
 * Applies the group_members RLS recursion fix migration directly to the database.
 * 
 * Usage: npx tsx scripts/db/apply-rls-fix.ts
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { readFileSync } from 'fs';
import { join } from 'path';

const migrationSQL = readFileSync(
  join(process.cwd(), 'supabase/migrations/20250130000007_fix_group_members_rls_recursion.sql'),
  'utf-8'
);

async function applyMigration() {
  console.log('🔧 Applying RLS fix migration...');
  
  const admin = createAdminClient();
  
  try {
    // Split SQL into individual statements and execute
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.length > 0) {
        const { error } = await admin.rpc('exec_sql', { sql: statement });
        if (error) {
          // Try direct query if RPC doesn't work
          const { error: directError } = await admin.from('_migrations').select('*').limit(0);
          if (directError) {
            console.error('❌ Error executing statement:', error.message);
            throw error;
          }
        }
      }
    }
    
    // Actually, let's use the Supabase REST API to execute raw SQL
    // We'll need to use the admin client's connection
    console.log('📝 Executing migration SQL...');
    
    // Execute the full migration as a single transaction
    const { error } = await admin.rpc('exec_sql', { 
      sql: migrationSQL 
    });
    
    if (error) {
      // Fallback: execute statement by statement
      console.log('⚠️  RPC failed, trying statement-by-statement...');
      
      // Use a different approach - execute via REST API
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || '',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || ''}`,
          },
          body: JSON.stringify({ sql: migrationSQL }),
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Migration failed: ${errorText}`);
      }
      
      console.log('✅ Migration applied successfully!');
    } else {
      console.log('✅ Migration applied successfully!');
    }
    
  } catch (error) {
    console.error('❌ Failed to apply migration:', error);
    console.error('\n📋 Please apply this migration manually via Supabase Studio:');
    console.error('   1. Go to https://supabase.com/dashboard/project/ohkueislstxomdjavyhs/sql/new');
    console.error('   2. Copy the contents of: supabase/migrations/20250130000007_fix_group_members_rls_recursion.sql');
    console.error('   3. Paste and execute');
    process.exit(1);
  }
}

applyMigration();
