/**
 * Cat topic discovery — "I'm interested in longevity" → what exists here, and
 * WHO is behind it.
 *
 * Two design decisions worth knowing:
 *
 * 1. People are found through their WORK, not their bios. Only a handful of
 *    profiles carry any bio text, so a bio-only people search finds almost
 *    nobody. Instead we match entities semantically and then aggregate the
 *    owners behind the hits — someone into longevity is discoverable through
 *    the research they published, which is also the stronger signal.
 *
 * 2. Everything surfaced here is PUBLIC. Each type's public predicate mirrors
 *    the discover/search SSOT (see fetchDiscoverCounts + the public-surface
 *    filtering contract test); test rows are excluded. This service runs with
 *    the caller's client, so RLS is the backstop, not the only gate.
 */

import { DATABASE_TABLES } from '@/config/database-tables';
import { ENTITY_REGISTRY, isValidEntityType, type EntityType } from '@/config/entity-registry';
import { embeddingsEnabled, embedText } from '@/services/ai/embeddings';
import { logger } from '@/utils/logger';
import type { AnySupabaseClient } from '@/lib/supabase/types';

const LOG_SOURCE = 'CatDiscovery';

/** Pull generously from the index, then filter/rank down — recall first. */
const MATCH_COUNT = 40;
/** Below this a hit is topically unrelated (match_content default is 0.35). */
const MIN_SIMILARITY = 0.3;
/** Cap what reaches the model, so the digest stays readable. */
const MAX_ENTITIES_RETURNED = 12;
const MAX_PEOPLE_RETURNED = 8;

export interface DiscoveryPerson {
  userId: string | null;
  displayName: string;
  username: string | null;
  profileUrl: string | null;
  /** What they published that matched — why they're relevant. */
  via: string[];
}

export interface DiscoveryHit {
  entityType: EntityType;
  entityId: string;
  title: string;
  description: string | null;
  url: string;
  similarity: number;
  owner: DiscoveryPerson | null;
}

export interface DiscoveryResult {
  topic: string;
  hits: DiscoveryHit[];
  people: DiscoveryPerson[];
  /** True when the semantic index could not be consulted at all. */
  degraded: boolean;
}

interface MatchRow {
  entity_type: string;
  entity_id: string;
  title: string | null;
  url: string | null;
  text_preview: string | null;
  similarity: number;
}

/**
 * Public-visibility predicate per type, applied when we re-read the row to
 * enrich it. The index can lag a row going private, so this is the gate that
 * actually decides what a user sees.
 */
function applyPublicGate(query: unknown, type: EntityType): unknown {
  const q = query as {
    eq: (c: string, v: unknown) => unknown;
    in: (c: string, v: unknown[]) => unknown;
  };
  switch (type) {
    case 'wishlist':
      return (q.eq('visibility', 'public') as typeof q).eq('is_active', true);
    case 'circle':
      return (q.eq('visibility', 'public') as typeof q).eq('status', 'active');
    case 'group':
      return q.eq('is_public', true);
    case 'research':
    case 'ai_assistant':
    case 'loan':
      return (q.eq('is_public', true) as typeof q).eq('status', 'active');
    case 'investment':
      return q.eq('is_public', true);
    case 'event':
      return q.in('status', ['published', 'open', 'ongoing']);
    default:
      return q.eq('status', 'active');
  }
}

/** Resolve the human behind an entity: actor → profile. */
async function resolveOwner(
  supabase: AnySupabaseClient,
  actorId: string | null,
  ownerUserId: string | null
): Promise<DiscoveryPerson | null> {
  try {
    let userId = ownerUserId;
    let displayName: string | null = null;

    if (actorId) {
      const { data: actor } = await supabase
        .from(DATABASE_TABLES.ACTORS)
        .select('user_id, display_name')
        .eq('id', actorId)
        .maybeSingle();
      const a = actor as { user_id: string | null; display_name: string | null } | null;
      userId = userId ?? a?.user_id ?? null;
      displayName = a?.display_name ?? null;
    }
    if (!userId) {
      return displayName ? { userId: null, displayName, username: null, profileUrl: null, via: [] } : null;
    }

    const { data: profile } = await supabase
      .from(DATABASE_TABLES.PROFILES)
      .select('username, name')
      .eq('id', userId)
      .maybeSingle();
    const p = profile as { username: string | null; name: string | null } | null;
    const username = p?.username ?? null;
    return {
      userId,
      displayName: p?.name || displayName || username || 'Someone',
      username,
      profileUrl: username ? `/profiles/${username}` : null,
      via: [],
    };
  } catch {
    return null;
  }
}

/** Re-read a matched row so the card has live, public, owner-attributed data. */
async function enrichHit(
  supabase: AnySupabaseClient,
  row: MatchRow
): Promise<DiscoveryHit | null> {
  if (!isValidEntityType(row.entity_type)) {
    return null;
  }
  const type = row.entity_type as EntityType;
  const meta = ENTITY_REGISTRY[type];
  const titleCol = meta.titleColumn ?? 'title';

  try {
    let q = supabase
      .from(meta.tableName)
      .select(`id, ${titleCol}, description, actor_id, user_id, is_test`)
      .eq('id', row.entity_id);
    q = applyPublicGate(q, type) as typeof q;
    const { data, error } = await (q as unknown as { maybeSingle: () => Promise<{ data: unknown; error: unknown }> }).maybeSingle();
    if (error || !data) {
      // Row is gone or no longer public — the index lagged. Drop it.
      return null;
    }
    const rec = data as Record<string, unknown>;
    // Never surface rows created by test API keys on a discovery surface.
    if (rec.is_test === true) {
      return null;
    }

    const owner = await resolveOwner(
      supabase,
      typeof rec.actor_id === 'string' ? rec.actor_id : null,
      typeof rec.user_id === 'string' ? rec.user_id : null
    );

    return {
      entityType: type,
      entityId: row.entity_id,
      title: String(rec[titleCol] ?? row.title ?? '(untitled)'),
      description:
        typeof rec.description === 'string' && rec.description
          ? rec.description.slice(0, 300)
          : (row.text_preview ?? null),
      url: row.url ?? `${meta.publicBasePath}/${row.entity_id}`,
      similarity: row.similarity,
      owner,
    };
  } catch (err) {
    logger.warn('discovery enrich failed', { err, type }, LOG_SOURCE);
    return null;
  }
}

/** A profile that matched directly (has a bio) — kept as a bonus signal. */
function personFromProfileRow(row: MatchRow): DiscoveryPerson | null {
  const username = row.url?.startsWith('/profiles/') ? row.url.slice('/profiles/'.length) : null;
  if (!username) {
    return null;
  }
  return {
    userId: row.entity_id,
    displayName: row.title || username,
    username,
    profileUrl: row.url,
    via: row.text_preview ? [row.text_preview.slice(0, 140)] : [],
  };
}

/**
 * Find everything on the platform related to a topic, plus the people behind
 * it. Returns `degraded: true` (never throws) when the semantic index is
 * unavailable, so the caller can say so honestly instead of implying the
 * platform is empty.
 */
export async function exploreTopic(
  supabase: AnySupabaseClient,
  viewerUserId: string,
  topic: string,
  opts: { entityType?: EntityType } = {}
): Promise<DiscoveryResult> {
  const empty: DiscoveryResult = { topic, hits: [], people: [], degraded: false };
  if (!topic.trim()) {
    return empty;
  }
  if (!embeddingsEnabled()) {
    return { ...empty, degraded: true };
  }

  let rows: MatchRow[] = [];
  try {
    const vec = await embedText(topic);
    if (!vec) {
      return { ...empty, degraded: true };
    }
    const { data, error } = await supabase.rpc('match_content', {
      query_embedding: JSON.stringify(vec),
      match_count: MATCH_COUNT,
      filter_type: opts.entityType ?? null,
      min_similarity: MIN_SIMILARITY,
    });
    if (error) {
      logger.warn('match_content failed', { error }, LOG_SOURCE);
      return { ...empty, degraded: true };
    }
    rows = (data ?? []) as MatchRow[];
  } catch (err) {
    logger.warn('exploreTopic threw', { err }, LOG_SOURCE);
    return { ...empty, degraded: true };
  }

  // Profiles that matched on their own text are people directly; everything
  // else is an entity whose owner we resolve below.
  const peopleByUser = new Map<string, DiscoveryPerson>();
  for (const r of rows.filter(r => r.entity_type === 'profile')) {
    const person = personFromProfileRow(r);
    if (person && person.userId !== viewerUserId) {
      peopleByUser.set(person.userId!, person);
    }
  }

  const entityRows = rows.filter(r => r.entity_type !== 'profile');
  const enriched = (await Promise.all(entityRows.map(r => enrichHit(supabase, r)))).filter(
    (h): h is DiscoveryHit => h !== null
  );

  // The user's own entities aren't a discovery — exclude them.
  const hits = enriched
    .filter(h => h.owner?.userId !== viewerUserId)
    .slice(0, MAX_ENTITIES_RETURNED);

  // Aggregate owners: this is how people become discoverable without bios.
  for (const h of hits) {
    const o = h.owner;
    if (!o?.userId) {
      continue;
    }
    const existing = peopleByUser.get(o.userId);
    const via = `${ENTITY_REGISTRY[h.entityType].name}: ${h.title}`;
    if (existing) {
      if (existing.via.length < 3) {
        existing.via.push(via);
      }
    } else {
      peopleByUser.set(o.userId, { ...o, via: [via] });
    }
  }

  return {
    topic,
    hits,
    people: [...peopleByUser.values()].slice(0, MAX_PEOPLE_RETURNED),
    degraded: false,
  };
}

/** Render a discovery result as the compact prose digest the model reads. */
export function formatDiscoveryForModel(result: DiscoveryResult): string {
  if (result.degraded) {
    return `TOPIC SEARCH UNAVAILABLE for "${result.topic}" — the semantic index could not be reached. Tell the user honestly that you could not search right now; do NOT claim the platform has nothing on this topic.`;
  }
  if (result.hits.length === 0 && result.people.length === 0) {
    return `No public entities or people on OrangeCat match "${result.topic}" yet. Say so plainly — and note that this makes them early here, which is an opportunity to be the first (offer to help them create something in this space).`;
  }

  const byType = new Map<EntityType, DiscoveryHit[]>();
  for (const h of result.hits) {
    byType.set(h.entityType, [...(byType.get(h.entityType) ?? []), h]);
  }

  const parts: string[] = [`RELATED TO "${result.topic}" ON ORANGECAT (all public):`];
  for (const [type, hits] of byType) {
    const meta = ENTITY_REGISTRY[type];
    parts.push(`\n${meta.namePlural}:`);
    for (const h of hits) {
      const who = h.owner ? ` — by ${h.owner.displayName}${h.owner.username ? ` (@${h.owner.username})` : ''}` : '';
      const desc = h.description ? ` :: ${h.description.slice(0, 160)}` : '';
      parts.push(`- "${h.title}"${who} [${h.url}] (relevance ${h.similarity.toFixed(2)})${desc}`);
    }
  }

  if (result.people.length > 0) {
    parts.push(`\nPEOPLE working on this (introduce these — use entity_id from above with request_introduction):`);
    for (const p of result.people) {
      const handle = p.username ? `@${p.username}` : p.displayName;
      parts.push(`- ${p.displayName} (${handle})${p.via.length > 0 ? ` — ${p.via.join('; ')}` : ''}`);
    }
  }

  parts.push(
    `\nPresent this as a short guided tour, not a list dump: group by what it IS, say in one clause WHY each is relevant to their interest, and link the titles. Then offer the concrete next step — following someone, or an introduction (request_introduction) to the person whose work fits best. Never invent entities or people beyond this list.`
  );
  return parts.join('\n');
}
