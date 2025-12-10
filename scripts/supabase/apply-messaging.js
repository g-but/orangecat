#!/usr/bin/env node
/**
 * Apply messaging migrations to Supabase via Management API
 * - No external deps; loads .env.local manually
 * - Applies SQL files sequentially for clear errors
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

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

async function postQuery(projectRef, token, sql) {
  const payload = JSON.stringify({ query: sql });
  const options = {
    hostname: 'api.supabase.com',
    port: 443,
    path: `/v1/projects/${projectRef}/database/query`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (d) => (body += d.toString()));
      res.on('end', () => {
        resolve({ status: res.statusCode || 0, ok: res.statusCode === 200, body });
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

(async () => {
  try {
    loadEnvLocal();
    const token = process.env.SUPABASE_ACCESS_TOKEN;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const projectRef = supabaseUrl ? getProjectRefFromUrl(supabaseUrl) : null;

    if (!token || !projectRef) {
      console.error('❌ Missing SUPABASE_ACCESS_TOKEN or NEXT_PUBLIC_SUPABASE_URL');
      process.exit(1);
    }

    const files = [
      'supabase/migrations/20251207_create_private_messaging.sql',
      'supabase/migrations/20251208_create_group_conversation_function.sql',
      'supabase/migrations/20251208_fix_messaging_views.sql',
      'supabase/migrations/20251208_grant_messaging_permissions.sql',
    ];

    for (const rel of files) {
      const full = path.resolve(rel);
      if (!fs.existsSync(full)) {
        console.error(`❌ Migration file missing: ${rel}`);
        process.exit(1);
      }
    }

    console.log('🚀 Applying messaging migrations...\n');
    for (const rel of files) {
      const full = path.resolve(rel);
      const sql = fs.readFileSync(full, 'utf8');
      console.log(`📝 ${rel}`);
      const res = await postQuery(projectRef, token, sql);
      if (!res.ok) {
        console.error(`❌ Failed: ${rel}`);
        console.error('Status:', res.status);
        console.error('Body:', res.body);
        process.exit(1);
      }
      console.log('✅ Applied\n');
    }

    console.log('🎉 All messaging migrations applied successfully');
  } catch (e) {
    console.error('❌ Error:', e.message || String(e));
    process.exit(1);
  }
})();

