#!/usr/bin/env node
/**
 * Apply SQL migrations directly via Postgres (Supabase) using service role key.
 * - No dotenv; loads .env.local manually
 * - Executes each SQL file in a single transaction
 */

const fs = require('fs');
const path = require('path');

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i === -1) continue;
    const k = line.slice(0, i).trim();
    const v = line.slice(i + 1).trim();
    if (!(k in process.env)) process.env[k] = v;
  }
}

function getProjectRefFromUrl(url) {
  try {
    const u = new URL(url);
    const host = u.hostname; // <ref>.supabase.co
    const parts = host.split('.');
    if (parts.length >= 3 && parts[1] === 'supabase' && parts[2] === 'co') {
      return parts[0];
    }
    return null;
  } catch {
    return null;
  }
}

(async () => {
  loadEnvLocal();
  const { Client } = require('pg');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or service role key');
    process.exit(1);
  }
  const ref = getProjectRefFromUrl(supabaseUrl);
  if (!ref) {
    console.error('❌ Could not parse project ref from NEXT_PUBLIC_SUPABASE_URL');
    process.exit(1);
  }

  const connStr = `postgresql://postgres:${encodeURIComponent(serviceKey)}@db.${ref}.supabase.co:5432/postgres`;
  const client = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });

  const files = process.argv.slice(2);
  if (files.length === 0) {
    console.error('Usage: node scripts/supabase/pg-apply-sql.js <file1.sql> [file2.sql ...]');
    process.exit(1);
  }

  for (const rel of files) {
    const full = path.resolve(rel);
    if (!fs.existsSync(full)) {
      console.error(`❌ File not found: ${rel}`);
      process.exit(1);
    }
  }

  try {
    await client.connect();
    console.log('🗄️  Connected to Supabase Postgres');

    for (const rel of files) {
      const full = path.resolve(rel);
      const sql = fs.readFileSync(full, 'utf8');
      console.log(`\n📝 Applying ${rel} ...`);
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');
        console.log(`✅ Applied ${rel}`);
      } catch (e) {
        await client.query('ROLLBACK');
        console.error(`❌ Failed ${rel}:`, e.message);
        process.exit(1);
      }
    }

    console.log('\n🎉 All files applied successfully');
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  } finally {
    try { await client.end(); } catch {}
  }
})();

