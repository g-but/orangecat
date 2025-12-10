const { Client } = require('pg');

// Local Supabase database connection
const client = new Client({
  host: '127.0.0.1',
  port: 54322,
  database: 'postgres',
  user: 'postgres',
  password: 'postgres',
});

async function checkTables() {
  try {
    await client.connect();
    console.log('Connected to local Supabase database');

    // Check what tables exist
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('Existing tables:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // Specifically check for loans table
    const loansExists = result.rows.some(row => row.table_name === 'loans');
    console.log(`\nLoans table exists: ${loansExists ? 'YES' : 'NO'}`);
    console.log(`Assets table exists: ${result.rows.some(row => row.table_name === 'assets') ? 'YES' : 'NO'}`);

  } catch (error) {
    console.error('Check failed:', error);
  } finally {
    await client.end();
  }
}

checkTables();














