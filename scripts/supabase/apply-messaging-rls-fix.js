// Apply non-recursive RLS policy fix for conversation_participants
// Usage: node scripts/supabase/apply-messaging-rls-fix.js

const fs = require('fs');
const { Client } = require('pg');

function loadEnv() {
  const path = '.env.local';
  if (!fs.existsSync(path)) throw new Error('.env.local not found');
  const raw = fs.readFileSync(path, 'utf8');
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    const k = m[1];
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1,-1);
    env[k] = v;
  }
  return env;
}

function buildConn(env) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  const ref = new URL(url).hostname.split('.')[0];
  const host = `db.${ref}.supabase.co`;
  return `postgresql://postgres:${encodeURIComponent(key)}@${host}:5432/postgres`;
}

async function main() {
  const env = loadEnv();
  const sqlPath = 'supabase/migrations/20251210_fix_participants_policy_function.sql';
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const client = new Client({ connectionString: buildConn(env) });
  await client.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('Applied migration:', sqlPath);
    console.log('Now set MESSAGING_RLS_FIXED=true in .env to use pure RLS.');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', e.message);
    process.exit(2);
  } finally {
    await client.end();
  }
}

main().catch(e => { console.error(e); process.exit(1); });

