/**
 * Seed the genesis allocation policy (v1, bootstrap).
 *
 * Owner-gated and idempotent: upserts allocation_policy v1 with content from
 * the src/config/solon.ts SSOT (byte-identical to Solon's seeded v1) and its
 * canonical content hash. Solon refs stay NULL — v1 is the one version that
 * exists without a vote; every later version requires a verified Solon
 * decision (activateVersion refuses otherwise).
 *
 * Run:
 *   ORANGECAT_OWNER_SEED=1 npx tsx scripts/solon/seed-genesis-policy.ts
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';
import { ALLOCATION_POLICY_KEY, GENESIS_ALLOCATION_POLICY } from '../../src/config/solon';
import { contentHashOf } from '../../src/services/solon/canonical';

loadEnv({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function die(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(1);
}

if (process.env.ORANGECAT_OWNER_SEED !== '1') {
  die('Refusing to run without ORANGECAT_OWNER_SEED=1 (owner-gated).');
}
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  die('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the environment.');
}

const admin: SupabaseClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const contentHash = contentHashOf(GENESIS_ALLOCATION_POLICY);

  const { data: existing } = await admin
    .from('allocation_policies')
    .select('id, status, content_hash')
    .eq('policy_key', ALLOCATION_POLICY_KEY)
    .eq('version', 1)
    .maybeSingle();

  if (existing) {
    if (existing.content_hash !== contentHash) {
      die(
        `v1 already exists with a DIFFERENT content hash (${existing.content_hash} != ${contentHash}) — refusing to overwrite history.`
      );
    }
    console.log(`✓ genesis policy already seeded (${existing.status}), nothing to do`);
    return;
  }

  const { error } = await admin.from('allocation_policies').insert({
    policy_key: ALLOCATION_POLICY_KEY,
    version: 1,
    content: GENESIS_ALLOCATION_POLICY,
    content_hash: contentHash,
    status: 'active',
    activated_at: new Date().toISOString(),
  });
  if (error) die(`insert failed: ${error.message}`);

  console.log(
    `✓ genesis allocation policy v1 seeded (active), content_hash ${contentHash} — first change requires a Solon vote`
  );
}

main().catch(e => die(e instanceof Error ? e.message : String(e)));
