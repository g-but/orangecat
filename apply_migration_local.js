const { Client } = require('pg');

// Local Supabase database connection
const client = new Client({
  host: '127.0.0.1',
  port: 54322,
  database: 'postgres',
  user: 'postgres',
  password: 'postgres',
});

async function applyMigrationLocally() {
  try {
    await client.connect();
    console.log('Connected to local Supabase database');

    const fs = require('fs');
    const path = require('path');

    // First apply loans migration
    console.log('Applying loans migration first...');
    const loansMigrationPath = path.join(__dirname, 'supabase', 'migrations', '20251202_create_loans_system.sql');
    const loansSQL = fs.readFileSync(loansMigrationPath, 'utf8');

    await client.query(loansSQL);
    console.log('Loans migration applied successfully!');

    // Then apply assets migration
    console.log('Applying assets migration...');
    const assetsMigrationPath = path.join(__dirname, 'supabase', 'migrations', '20251205090000_add_assets_and_collateral.sql');
    const assetsSQL = fs.readFileSync(assetsMigrationPath, 'utf8');

    await client.query(assetsSQL);
    console.log('Assets migration applied successfully!');

    // Test if the assets table was created
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'assets'
    `);

    if (result.rows.length > 0) {
      console.log('✅ Assets table exists!');
    } else {
      console.log('❌ Assets table not found');
    }

    // Test if the loan_collateral table was created
    const collateralResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'loan_collateral'
    `);

    if (collateralResult.rows.length > 0) {
      console.log('✅ Loan collateral table exists!');
    } else {
      console.log('❌ Loan collateral table not found');
    }

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

applyMigrationLocally();














