#!/usr/bin/env node
/**
 * Apply RLS Fix Migration
 * 
 * Applies the group_members RLS recursion fix migration directly to the database.
 * 
 * Usage: node scripts/db/apply-rls-fix.js
 */

require('dotenv').config({ path: '.env.local' });
const { readFileSync } = require('fs');
const { join } = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function executeSQL(sql, description) {
  console.log(`📝 Executing: ${description}`);

  try {
    // Use PostgREST to execute SQL via a function call
    // First, let's try using the admin client approach via direct SQL execution
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ sql }),
    });

    if (response.ok) {
      console.log(`✅ ${description} - SUCCESS`);
      return true;
    } else {
      const errorText = await response.text();
      console.error(`❌ ${description} - FAILED`);
      console.error(`   Status: ${response.status}`);
      console.error(`   Error: ${errorText.substring(0, 200)}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ ${description} - ERROR:`, error.message);
    return false;
  }
}

async function applyMigration() {
  console.log('🚀 Applying RLS fix migration...\n');
  
  try {
    const migrationPath = join(__dirname, '../../supabase/migrations/20250130000007_fix_group_members_rls_recursion.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    // Split into statements (handling multi-line statements with $$)
    const statements = [];
    let currentStatement = '';
    let inDollarQuote = false;
    let dollarTag = '';
    
    const lines = migrationSQL.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip comments
      if (trimmed.startsWith('--')) continue;
      
      // Handle dollar-quoted strings (for function definitions)
      if (trimmed.includes('$$')) {
        const dollarMatches = trimmed.match(/\$\$([^$]*)\$\$/g);
        if (dollarMatches) {
          // Complete dollar quote on same line
          currentStatement += line + '\n';
          if (trimmed.endsWith(';')) {
            statements.push(currentStatement.trim());
            currentStatement = '';
          }
          continue;
        }
        
        // Start or end of dollar quote
        const dollarTagMatch = trimmed.match(/\$\$([^$]*)?/);
        if (dollarTagMatch) {
          if (!inDollarQuote) {
            inDollarQuote = true;
            dollarTag = dollarTagMatch[0];
          } else if (trimmed.includes(dollarTag)) {
            inDollarQuote = false;
            dollarTag = '';
          }
        }
      }
      
      currentStatement += line + '\n';
      
      // If we're not in a dollar quote and see a semicolon, it's the end of a statement
      if (!inDollarQuote && trimmed.endsWith(';')) {
        const stmt = currentStatement.trim();
        if (stmt && !stmt.startsWith('--')) {
          statements.push(stmt);
        }
        currentStatement = '';
      }
    }
    
    // Add any remaining statement
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }
    
    console.log(`📊 Found ${statements.length} SQL statements to execute\n`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement || statement.length < 10) continue;
      
      const description = statement.substring(0, 60).replace(/\n/g, ' ') + '...';
      const success = await executeSQL(statement, `[${i + 1}/${statements.length}] ${description}`);
      
      if (success) {
        successCount++;
      } else {
        failCount++;
        // Don't stop on first error - some statements might fail safely
        if (statement.includes('DROP POLICY IF EXISTS') || statement.includes('CREATE OR REPLACE')) {
          console.log('   ⚠️  Continuing despite error (expected for idempotent operations)');
        }
      }
      
      // Small delay between statements
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n📊 Results: ${successCount} success, ${failCount} failed`);
    
    if (failCount === 0) {
      console.log('\n✅ Migration applied successfully!');
      console.log('🔄 Please refresh the browser to test groups functionality.');
    } else {
      console.log('\n⚠️  Some statements failed. Please check the errors above.');
      console.log('💡 You may need to apply this migration manually via Supabase Studio SQL editor.');
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
