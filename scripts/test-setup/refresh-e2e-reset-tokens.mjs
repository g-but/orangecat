#!/usr/bin/env node
/**
 * Mint a DISPOSABLE per-run user + fresh password-reset session tokens for
 * the reset E2E test.
 *
 * Why per-run: the reset flow consumes a single-use recovery token and then
 * CHANGES the password. Pointed at the shared fixture user, concurrent CI
 * runs invalidated each other's tokens (GoTrue keeps one recovery token per
 * user) and flipped the shared password mid-run — the 2026-08-02 "flake"
 * cluster. A unique throwaway user per run makes concurrency irrelevant.
 * Old throwaways (>1 day) are cleaned up opportunistically each run.
 *
 * Prints GitHub Actions env lines when GITHUB_ENV is set, else shell exports.
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import ws from 'ws';
import { createClient } from '@supabase/supabase-js';

const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Unique per run (workflow run id in CI, pid+time locally) so no other run
// can touch this user's recovery token or password.
const runTag = process.env.GITHUB_RUN_ID || `${process.pid}-${Date.now()}`;
const email = `e2e-reset-${runTag}@orangecat.ch`;

if (!url || !serviceKey || !anonKey) {
  console.error('Missing Supabase env for reset token refresh');
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws },
});

// Opportunistic cleanup of yesterday's throwaway reset users. Best-effort —
// a failure here must never block the run.
try {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  for (let page = 1; page <= 10; page++) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    const users = data?.users ?? [];
    for (const u of users) {
      if (/^e2e-reset-/.test(u.email || '') && new Date(u.created_at).getTime() < cutoff) {
        await admin.auth.admin.deleteUser(u.id);
        console.log(`cleaned up stale reset user ${u.email}`);
      }
    }
    if (users.length < 100) break;
  }
} catch (e) {
  console.warn('stale reset-user cleanup skipped:', e?.message ?? e);
}

const { error: createErr } = await admin.auth.admin.createUser({
  email,
  password: `Reset-${runTag}-Aa1!`,
  email_confirm: true,
  user_metadata: { preferred_username: `e2e_reset_${runTag}`, name: 'E2E Reset User' },
});
if (createErr) {
  console.error('createUser for reset fixture failed', createErr);
  process.exit(1);
}
console.log(`created disposable reset user ${email}`);

const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
  type: 'recovery',
  email,
});
if (linkErr || !linkData?.properties?.hashed_token) {
  console.error('generateLink failed', linkErr);
  process.exit(1);
}

const client = createClient(url, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws },
});

const { data: sessionData, error: otpErr } = await client.auth.verifyOtp({
  type: 'recovery',
  token_hash: linkData.properties.hashed_token,
});

if (otpErr || !sessionData?.session) {
  console.error('verifyOtp failed', otpErr);
  process.exit(1);
}

const accessToken = sessionData.session.access_token;
const refreshToken = sessionData.session.refresh_token;
const githubEnv = process.env.GITHUB_ENV;

if (githubEnv) {
  fs.appendFileSync(githubEnv, `E2E_RESET_ACCESS_TOKEN=${accessToken}\n`);
  fs.appendFileSync(githubEnv, `E2E_RESET_REFRESH_TOKEN=${refreshToken}\n`);
}

console.log(`E2E_RESET_ACCESS_TOKEN=${accessToken}`);
console.log(`E2E_RESET_REFRESH_TOKEN=${refreshToken}`);
