#!/usr/bin/env node

/**
 * Apply Loans System Migration
 * Uses direct PostgreSQL connection to apply the loans database schema
 */

const { Client } = require('pg');
const { readFileSync } = require('fs');
const { join } = require('path');

// Local Supabase database connection
const client = new Client({
  host: '127.0.0.1',
  port: 54322,
  database: 'postgres',
  user: 'postgres',
  password: 'postgres',
});

async function applyLoansMigration() {
  try {
    console.log('🚀 Applying Loans System Migration...\n');

    await client.connect();
    console.log('✅ Connected to local Supabase database');

    // Read the migration file
    const migrationPath = join(
      process.cwd(),
      'supabase/migrations/20251202_create_loans_system.sql'
    );

    console.log(`📄 Reading migration from: ${migrationPath}`);
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    console.log(`📏 Migration size: ${migrationSQL.length} characters\n`);

    // Execute the entire migration as one statement
    console.log('⚡ Executing loans migration...');

    await client.query(migrationSQL);

    console.log('\n🎉 Loans migration completed successfully!');
    console.log('\n📋 Created tables:');
    console.log('   ✅ loan_categories - Loan type categories');
    console.log('   ✅ loans - User loan listings');
    console.log('   ✅ loan_offers - Refinancing offers');
    console.log('   ✅ loan_payments - Payment tracking');
    console.log('   ✅ RLS policies and functions');

    // Verify tables were created
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name LIKE '%loan%'
      ORDER BY table_name
    `);

    console.log('\n🔍 Verification - Loan tables created:');
    result.rows.forEach(row => {
      console.log(`   ✅ ${row.table_name}`);
    });

    console.log('\n🧪 Ready for testing loans functionality!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyLoansMigration();


























