/**
 * Seed "Substrate" — an open-source research firm covering the chokepoints
 * between here and a technological singularity, with a trading desk on the
 * materials it knows best — as an OrangeCat group profile with its own actor
 * and catalogue.
 *
 * OrangeCat is the SSOT for economic entities. A company is a `group` (label
 * 'company') that owns an `actors` row of actor_type 'group'; everything the
 * company lists hangs off that actor, which is what makes a group's store work
 * the same way a person's does.
 *
 * Idempotent: resolves the founder by actor slug at runtime, upserts the group
 * by slug, the actor by group_id, membership and features by their unique keys,
 * and each listing by (actor_id, title). Never truncates. Safe to re-run.
 * Owner-gated so it can't fire by accident.
 *
 * Run against the LIVE self-hosted DB (supabase.orangecat.ch) from the box:
 *   ORANGECAT_OWNER_SEED=1 npx tsx scripts/seed-substrate.ts
 *
 * Requires in the environment (already in .env.local on the box):
 *   NEXT_PUBLIC_SUPABASE_URL   — self-hosted Supabase URL
 *   SUPABASE_SERVICE_ROLE_KEY  — service role (bypasses RLS for the seed)
 *
 * Created: 2026-08-26
 */

import { config as loadEnv } from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  COMPANY,
  FOUNDER_ACTOR_SLUG,
  GROUP_FEATURE_KEYS,
  GROUP_PAYLOAD,
  PRODUCT_PAYLOADS,
  type MaterialProductPayload,
} from '../src/config/substrate';

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

interface FounderRow {
  id: string;
  user_id: string;
}

/** The user behind FOUNDER_ACTOR_SLUG — `groups.created_by` needs a real user. */
async function resolveFounder(): Promise<FounderRow> {
  const { data, error } = await admin
    .from('actors')
    .select('id, user_id')
    .eq('slug', FOUNDER_ACTOR_SLUG)
    .maybeSingle();
  if (error) die(`Failed to resolve founder actor: ${error.message}`);
  if (!data) {
    die(`No actor with slug '${FOUNDER_ACTOR_SLUG}'. Create it or change FOUNDER_ACTOR_SLUG.`);
  }
  if (!data.user_id) die(`Actor '${FOUNDER_ACTOR_SLUG}' has no user_id; groups require one.`);
  return { id: data.id as string, user_id: data.user_id as string };
}

/** Upsert the company group by its (unique) slug. Returns its id. */
async function upsertGroup(founder: FounderRow): Promise<string> {
  const { data: existing, error: probeErr } = await admin
    .from('groups')
    .select('id')
    .eq('slug', GROUP_PAYLOAD.slug)
    .maybeSingle();
  if (probeErr) die(`Failed to look up group '${GROUP_PAYLOAD.slug}': ${probeErr.message}`);

  const row = {
    name: GROUP_PAYLOAD.name,
    slug: GROUP_PAYLOAD.slug,
    description: GROUP_PAYLOAD.description,
    label: GROUP_PAYLOAD.label,
    tags: GROUP_PAYLOAD.tags,
    is_public: GROUP_PAYLOAD.is_public,
    visibility: GROUP_PAYLOAD.visibility,
    governance_preset: GROUP_PAYLOAD.governance_preset,
    created_by: founder.user_id,
  };

  if (existing) {
    const { error } = await admin.from('groups').update(row).eq('id', existing.id);
    if (error) die(`Failed to update group: ${error.message}`);
    console.log(`↻ updated group "${GROUP_PAYLOAD.name}" (${existing.id})`);
    return existing.id as string;
  }

  const { data, error } = await admin.from('groups').insert(row).select('id').single();
  if (error) die(`Failed to insert group: ${error.message}`);
  console.log(`+ created group "${GROUP_PAYLOAD.name}" (${data.id})`);
  return data.id as string;
}

/**
 * Upsert the group's actor. Nothing creates this automatically — `createGroup`
 * in the app doesn't either — and without it the group can own nothing, since
 * every entity table keys on actor_id.
 */
async function upsertGroupActor(groupId: string): Promise<string> {
  const { data: existing, error: probeErr } = await admin
    .from('actors')
    .select('id')
    .eq('group_id', groupId)
    .eq('actor_type', 'group')
    .maybeSingle();
  if (probeErr) die(`Failed to look up group actor: ${probeErr.message}`);

  const row = {
    actor_type: 'group',
    group_id: groupId,
    user_id: null,
    display_name: COMPANY.name,
    slug: COMPANY.slug,
  };

  if (existing) {
    const { error } = await admin.from('actors').update(row).eq('id', existing.id);
    if (error) die(`Failed to update group actor: ${error.message}`);
    console.log(`↻ group actor '${COMPANY.slug}' (${existing.id})`);
    return existing.id as string;
  }

  const { data, error } = await admin.from('actors').insert(row).select('id').single();
  if (error) die(`Failed to insert group actor: ${error.message}`);
  console.log(`+ group actor '${COMPANY.slug}' (${data.id})`);
  return data.id as string;
}

/** The founder seat. Unique on (group_id, user_id), so ignore-on-conflict. */
async function ensureFounderMembership(groupId: string, founder: FounderRow): Promise<void> {
  const { error } = await admin
    .from('group_members')
    .upsert(
      { group_id: groupId, user_id: founder.user_id, role: 'founder' },
      { onConflict: 'group_id,user_id' }
    );
  if (error) die(`Failed to seat the founder: ${error.message}`);
  console.log(`  ✓ founder seat for actor '${FOUNDER_ACTOR_SLUG}'`);
}

/** Enable the features the company needs. Unique on (group_id, feature_key). */
async function ensureFeatures(groupId: string, founder: FounderRow): Promise<void> {
  if (GROUP_FEATURE_KEYS.length === 0) {
    return;
  }
  const rows = GROUP_FEATURE_KEYS.map(feature_key => ({
    group_id: groupId,
    feature_key,
    enabled: true,
    enabled_by: founder.user_id,
  }));
  const { error } = await admin
    .from('group_features')
    .upsert(rows, { onConflict: 'group_id,feature_key' });
  if (error) die(`Failed to enable features: ${error.message}`);
  console.log(`  ✓ features: ${GROUP_FEATURE_KEYS.join(', ')}`);
}

/** Idempotently write one catalogue listing, matched on (actor_id, title). */
async function upsertListing(
  groupId: string,
  groupActorId: string,
  founder: FounderRow,
  listing: MaterialProductPayload
): Promise<void> {
  const { data: existing, error: probeErr } = await admin
    .from('user_products')
    .select('id')
    .eq('actor_id', groupActorId)
    .eq('title', listing.title)
    .maybeSingle();
  if (probeErr) die(`Failed to look up listing '${listing.title}': ${probeErr.message}`);

  const row = {
    // user_products.user_id is NOT NULL and records who acts; ownership for
    // every read path is actor_id, which points at the group.
    user_id: founder.user_id,
    actor_id: groupActorId,
    group_id: groupId,
    title: listing.title,
    description: listing.description,
    price: listing.price,
    currency: listing.currency,
    product_type: listing.product_type,
    fulfillment_type: listing.fulfillment_type,
    category: listing.category,
    status: listing.status,
    tags: listing.tags,
    inventory_count: listing.inventory_count,
    show_on_profile: listing.show_on_profile,
    is_test: false,
  };

  if (existing) {
    const { error } = await admin.from('user_products').update(row).eq('id', existing.id);
    if (error) die(`Failed to update listing '${listing.title}': ${error.message}`);
    console.log(`  ↻ ${listing.title}`);
    return;
  }

  const { error } = await admin.from('user_products').insert(row);
  if (error) die(`Failed to insert listing '${listing.title}': ${error.message}`);
  console.log(`  + ${listing.title}`);
}

async function main(): Promise<void> {
  console.log(`Seeding "${COMPANY.name}" against ${SUPABASE_URL} …`);
  const founder = await resolveFounder();
  console.log(`founder actor '${FOUNDER_ACTOR_SLUG}' = ${founder.id}`);

  const groupId = await upsertGroup(founder);
  const groupActorId = await upsertGroupActor(groupId);
  await ensureFounderMembership(groupId, founder);
  await ensureFeatures(groupId, founder);

  console.log(`catalogue (${PRODUCT_PAYLOADS.length} listings):`);
  for (const listing of PRODUCT_PAYLOADS) {
    await upsertListing(groupId, groupActorId, founder, listing);
  }

  console.log(`✓ done. View at /groups/${COMPANY.slug}.`);
}

main().catch(err => die(err instanceof Error ? err.message : String(err)));
