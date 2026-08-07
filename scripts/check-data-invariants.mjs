#!/usr/bin/env node
/**
 * Nightly DATA-INVARIANT gate — assert against the rows production actually
 * holds, not the rows the unit tests imagine.
 *
 * Every test in this repo runs against mocks. That is why the shared-wallet
 * disclosure shipped wrong three times on 2026-08-02 with a fully green suite:
 * the mocks encoded the data shape we assumed (one address per wallet row,
 * links that point at live entities), and production held a different one
 * (the same address across 2–11 wallet rows, 8 of 10 links pointing at deleted
 * entities). No amount of unit testing finds that class — only reading prod
 * does. This runs the reading on a schedule.
 *
 * Each invariant is a claim the product makes to users. A violation means we
 * are showing someone something false about their money.
 *
 * Usage:
 *   node scripts/check-data-invariants.mjs           # report, always exit 0
 *   node scripts/check-data-invariants.mjs --gate    # exit 1 on any violation
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * (.env.local fallback for local runs, EnvironmentFile on the box).
 */

import { readFileSync, existsSync } from 'node:fs';

function loadLocalEnvFallback() {
  if (!existsSync('.env.local')) {
    return;
  }
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}
loadLocalEnvFallback();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GATE = process.argv.includes('--gate');

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('check-data-invariants: missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  process.exit(2);
}

async function rest(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SERVICE_KEY, authorization: `Bearer ${SERVICE_KEY}` },
  });
  if (!res.ok) {
    throw new Error(`PostgREST ${res.status} on ${path.split('?')[0]}: ${await res.text()}`);
  }
  return res.json();
}

/**
 * entity_type → table. MUST mirror src/config/entity-registry.ts; a type
 * missing here is reported as UNKNOWN rather than silently passing, so a new
 * entity type cannot quietly opt out of the orphan check.
 */
const ENTITY_TABLES = {
  product: 'user_products',
  service: 'user_services',
  project: 'projects',
  cause: 'user_causes',
  event: 'events',
  asset: 'assets',
  loan: 'loans',
  investment: 'investments',
  ai_assistant: 'ai_assistants',
  research: 'research_projects',
  wishlist: 'wishlists',
  document: 'documents',
  group: 'groups',
  circle: 'circles',
};

const violations = [];
const notes = [];

function violation(name, detail, sample) {
  violations.push({ name, detail, sample });
}

/**
 * Orphaned wallet links. entity_wallets is polymorphic, so Postgres cannot
 * cascade it — links outlive their entity unless the delete path removes them.
 * These rows made the shared-wallet disclosure count pages that do not exist.
 */
async function checkOrphanedWalletLinks() {
  const links = await rest('entity_wallets?select=id,entity_type,entity_id');
  const byType = new Map();
  for (const l of links) {
    byType.set(l.entity_type, [...(byType.get(l.entity_type) ?? []), l]);
  }

  const orphans = [];
  for (const [type, rows] of byType) {
    const table = ENTITY_TABLES[type];
    if (!table) {
      violation(
        'entity_wallets.unknown_entity_type',
        `entity_wallets holds type "${type}" with no table mapping — add it to ENTITY_TABLES (and check the entity registry)`,
        rows.slice(0, 3).map(r => r.entity_id)
      );
      continue;
    }
    const ids = rows.map(r => r.entity_id);
    const found = await rest(`${table}?select=id&id=in.(${ids.join(',')})`);
    const live = new Set(found.map(f => f.id));
    orphans.push(...rows.filter(r => !live.has(r.entity_id)));
  }

  if (orphans.length > 0) {
    violation(
      'entity_wallets.orphaned_links',
      `${orphans.length} wallet link(s) point at entities that no longer exist — the delete path is leaking again`,
      orphans.slice(0, 5).map(o => `${o.entity_type}:${o.entity_id}`)
    );
  } else {
    notes.push(`entity_wallets: ${links.length} link(s), all pointing at live entities`);
  }
}

/**
 * Two links flagged is_primary for the SAME entity. resolveLinkedEntityWallet
 * orders by is_primary with no tiebreaker, so which wallet receives the next
 * payment becomes nondeterministic — money routed by row order.
 */
async function checkDuplicatePrimaryLinks() {
  const links = await rest('entity_wallets?select=entity_type,entity_id,is_primary&is_primary=is.true');
  const seen = new Map();
  const dupes = [];
  for (const l of links) {
    const key = `${l.entity_type}:${l.entity_id}`;
    if (seen.has(key)) {
      dupes.push(key);
    }
    seen.set(key, true);
  }
  if (dupes.length > 0) {
    violation(
      'entity_wallets.duplicate_primary',
      `${dupes.length} entity/entities have more than one primary wallet link — payment routing is nondeterministic`,
      [...new Set(dupes)].slice(0, 5)
    );
  } else {
    notes.push(`entity_wallets: no entity has competing primary links`);
  }
}

/**
 * A wallet that can never receive: active, but holds neither a lightning
 * address, nor an on-chain address/xpub, nor an NWC connection. The UI can
 * still offer it, and resolution will silently skip to something else.
 */
async function checkUnpayableActiveWallets() {
  const wallets = await rest(
    'wallets?select=id,label,is_active,lightning_address,address_or_xpub,nwc_connection_uri&is_active=is.true'
  );
  const unpayable = wallets.filter(
    w => !w.lightning_address && !w.address_or_xpub && !w.nwc_connection_uri
  );
  if (unpayable.length > 0) {
    violation(
      'wallets.active_but_unpayable',
      `${unpayable.length} active wallet(s) have no lightning address, no on-chain address/xpub and no NWC connection`,
      unpayable.slice(0, 5).map(w => `${w.id} (${w.label ?? 'unlabelled'})`)
    );
  } else {
    notes.push(`wallets: all ${wallets.length} active wallet(s) have a usable receiving rail`);
  }
}

/**
 * Money-state divergence: an intent marked paid with no paid_at timestamp.
 * The settlement transition sets both together, so a mismatch means something
 * wrote the status outside claimPaidTransition.
 */
async function checkPaidWithoutTimestamp() {
  const rows = await rest('payment_intents?select=id,status,paid_at&status=eq.paid&paid_at=is.null');
  if (rows.length > 0) {
    violation(
      'payment_intents.paid_without_timestamp',
      `${rows.length} intent(s) are status=paid with paid_at NULL — status was set outside the settlement transition`,
      rows.slice(0, 5).map(r => r.id)
    );
  } else {
    notes.push('payment_intents: every paid intent carries a settlement timestamp');
  }
}

/**
 * A Cat send that stored nothing.
 *
 * A DEFAULT conversation is created in exactly one place — chat-prepare, while
 * serving a send — so a default conversation with zero messages means a request
 * reached the server and the user's message was never written. That was a real
 * bug until 2026-08-06: the streaming path saved a turn only `if (fullContent)`,
 * so a total provider-chain failure discarded the exchange. Six real accounts
 * are still frozen in that state from June 2026, each having tried Cat once.
 *
 * It went unnoticed for two months because the leftover row is indistinguishable
 * from "opened the page and never typed" — the failure erased its own evidence
 * and then counted as engagement. Hence a scheduled check rather than a test.
 *
 * Scoped to 30 days so the historical rows stay as evidence (they are the only
 * trace of those six attempts) without permanently reddening the gate. Empty
 * NON-default conversations are legitimate: the rail's "new chat" button makes
 * one before anything is typed.
 */
async function checkSilentlyDroppedCatTurns() {
  const since = new Date(Date.now() - 30 * 864e5).toISOString();
  const convs = await rest(
    `cat_conversations?select=id,user_id,created_at&is_default=eq.true&created_at=gte.${since}`
  );
  if (convs.length === 0) {
    notes.push('cat_conversations: no default conversations created in the last 30 days');
    return;
  }

  const ids = convs.map(c => c.id);
  const msgs = await rest(`cat_messages?select=conversation_id&conversation_id=in.(${ids.join(',')})`);
  const answered = new Set(msgs.map(m => m.conversation_id));
  const dropped = convs.filter(c => !answered.has(c.id));

  if (dropped.length > 0) {
    violation(
      'cat_conversations.send_stored_nothing',
      `${dropped.length} default conversation(s) hold zero messages — a send reached the server and the user's message was not persisted`,
      dropped.slice(0, 5).map(c => c.id)
    );
  } else {
    notes.push(`cat_conversations: all ${convs.length} recent send(s) stored their turn`);
  }
}

/**
 * Profiles whose auth user is gone.
 *
 * `public.profiles` has NO foreign key to `auth.users`, so deleting an auth
 * user leaves the profile — with its email, phone, location, bio and payment
 * addresses — behind forever. Nothing enforced it and nothing watched it, so
 * the per-CI-run throwaway users accumulated silently: on 2026-08-06 the table
 * held 188 rows of which 136 were CI exhaust and 115 were orphans, and every
 * product metric read off `profiles` was inflated by it.
 *
 * Beyond the noise this is the account-deletion path: the same missing
 * constraint means a real user pressing "delete my account" keeps their PII.
 * Until profiles is either cascaded or anonymised on delete, this check is the
 * thing standing between that bug and silence.
 */
async function checkOrphanedProfiles() {
  // PostgREST cannot join auth.users, so compare id sets. Profiles are small
  // enough (tens) that fetching both is cheaper than adding an RPC.
  const profiles = await rest('profiles?select=id,email');
  if (profiles.length === 0) {
    notes.push('profiles: table is empty');
    return;
  }

  const seen = new Set();
  for (let page = 0; page < 20; page++) {
    const res = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users?page=${page + 1}&per_page=200`,
      { headers: { apikey: SERVICE_KEY, authorization: `Bearer ${SERVICE_KEY}` } }
    );
    if (!res.ok) {
      throw new Error(`GoTrue admin list ${res.status}`);
    }
    const users = (await res.json())?.users ?? [];
    for (const u of users) {
      seen.add(u.id);
    }
    if (users.length < 200) break;
  }

  const orphans = profiles.filter(p => !seen.has(p.id));
  if (orphans.length > 0) {
    violation(
      'profiles.orphaned_from_auth',
      `${orphans.length} profile(s) have no auth user — deleting an account leaves its PII behind (profiles has no FK to auth.users)`,
      orphans.slice(0, 5).map(p => p.email || p.id)
    );
  } else {
    notes.push(`profiles: all ${profiles.length} row(s) have a live auth user`);
  }
}

async function main() {
  const checks = [
    checkOrphanedWalletLinks,
    checkDuplicatePrimaryLinks,
    checkUnpayableActiveWallets,
    checkPaidWithoutTimestamp,
    checkSilentlyDroppedCatTurns,
    checkOrphanedProfiles,
  ];

  for (const check of checks) {
    try {
      await check();
    } catch (err) {
      // A check that cannot run is itself a finding — never let an exception
      // read as "invariant holds".
      violation(check.name, `check failed to run: ${err.message}`, []);
    }
  }

  console.log('OrangeCat data invariants —', new Date().toISOString());
  for (const n of notes) {
    console.log(`  ok    ${n}`);
  }
  for (const v of violations) {
    console.log(`  FAIL  ${v.name}: ${v.detail}`);
    if (v.sample?.length) {
      console.log(`        e.g. ${v.sample.join(', ')}`);
    }
  }

  if (violations.length === 0) {
    console.log('All invariants hold.');
    process.exit(0);
  }
  console.log(`${violations.length} invariant(s) violated.`);
  process.exit(GATE ? 1 : 0);
}

main().catch(err => {
  console.error('check-data-invariants failed:', err);
  process.exit(2);
});
