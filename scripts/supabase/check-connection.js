#!/usr/bin/env node
/**
 * Supabase connectivity check (read-only)
 * - Loads .env.local (no secrets printed)
 * - Verifies Auth health endpoint
 * - Attempts a count-only select on a common public table (profiles)
 */

const path = require('path');
const fs = require('fs');

// Load .env.local if present
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  try {
    // Lightweight .env loader without external dependency
    const content = fs.readFileSync(envPath, 'utf8');
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      const val = line.slice(eq + 1).trim();
      if (!(key in process.env)) process.env[key] = val;
    }
    console.log('🔐 Loaded environment from .env.local');
  } catch (e) {
    console.log('⚠️  Failed to parse .env.local, using process env only');
  }
} else {
  console.log('⚠️  .env.local not found, using process env only');
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL missing');
  process.exit(1);
}
if (!ANON_KEY && !SERVICE_ROLE) {
  console.error('❌ No Supabase key found (need anon or service role)');
  process.exit(1);
}

const useServiceKey = Boolean(SERVICE_ROLE);
const API_KEY = useServiceKey ? SERVICE_ROLE : ANON_KEY;

async function checkAuthHealth() {
  const url = SUPABASE_URL.replace(/\/$/, '') + '/auth/v1/health';
  const res = await fetch(url, {
    headers: { apikey: API_KEY },
  });
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  return res.status;
}

async function tryProfilesCount() {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, API_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { count, error } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true });
    if (error) throw error;
    return count ?? 0;
  } catch (e) {
    // Fallback to PostgREST directly (no SDK)
    const url = SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/profiles?select=id&limit=1';
    const res = await fetch(url, {
      headers: {
        apikey: API_KEY,
        Authorization: `Bearer ${API_KEY}`,
        Prefer: 'count=exact',
      },
    });
    if (!res.ok) throw new Error(`REST error ${res.status}`);
    const range = res.headers.get('content-range');
    if (range && /\/(\d+)$/.test(range)) {
      return parseInt(RegExp.$1, 10);
    }
    // If range header missing, return 1 when body present
    const data = await res.json().catch(() => []);
    return Array.isArray(data) ? data.length : 0;
  }
}

(async () => {
  try {
    console.log(`🌐 Supabase URL present: yes`);
    console.log(`🔑 Using key type: ${useServiceKey ? 'service_role' : 'anon'}`);

    const status = await checkAuthHealth();
    console.log(`✅ Auth health check OK (status ${status})`);

    try {
      const count = await tryProfilesCount();
      console.log(`📊 profiles count (head-only): ${count}`);
    } catch (e) {
      console.log(`ℹ️  profiles count not available: ${e.message}`);
    }

    console.log('🎉 Supabase connectivity verified');
  } catch (err) {
    console.error('❌ Connectivity check failed:', err.message);
    process.exit(2);
  }
})();
