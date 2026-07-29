/**
 * Cat track record — the outcome feedback loop.
 *
 * Derives what actually HAPPENED to the entities Cat created with the user:
 * proposed → published → funded, grounded in real platform state instead of
 * model self-assessment. Zero new state: the proposal side is the existing
 * cat_action_log audit trail (create_* actions), the outcome side is the
 * entity tables themselves plus settled payment_intents. If state lives in
 * one place it can't disagree with itself — this module only ever reads.
 *
 * Fed into Cat's context (see context-sections.renderTrackRecord) so advice
 * is anchored in the user's observed results ("your priced-under-X services
 * got funded; the drafts from May never published") rather than vibes.
 *
 * Every path degrades gracefully: any query error or missing table returns
 * null / skips the row — Cat keeps working without the signal.
 */

import type { AnySupabaseClient } from '@/lib/supabase/types';
import { ENTITY_REGISTRY, ENTITY_TYPES, type EntityType } from '@/config/entity-registry';
import { DATABASE_TABLES } from '@/config/database-tables';
import { logger } from '@/utils/logger';

// ==================== TYPES ====================

export interface TrackRecordEntry {
  entityType: EntityType;
  entityId: string;
  title: string;
  /** When Cat created it (action log timestamp). */
  createdAt: string;
  /** Current status of the entity ('active', 'draft', …) or null if it no longer exists. */
  status: string | null;
  /** BTC actually received via settled payment intents (0 when none). */
  fundedBtc: number;
  /** Number of settled payments behind fundedBtc. */
  payments: number;
}

export interface CatTrackRecord {
  /** Completed create_* actions found in the window. */
  proposed: number;
  /** Entries whose entity currently has status 'active'. */
  published: number;
  /** Entries with at least one settled payment. */
  funded: number;
  totalFundedBtc: number;
  /** Most recent first; capped at MAX_ENTRIES. */
  entries: TrackRecordEntry[];
  windowDays: number;
}

// ==================== CONSTANTS ====================

/** How far back to look for Cat-created entities. */
const WINDOW_DAYS = 90;
/** Cap the per-entity list injected into context / returned to the UI. */
const MAX_ENTRIES = 12;
/** payment_intents statuses that mean money actually arrived (or the buyer says it did). */
const SETTLED_INTENT_STATUSES = ['paid', 'buyer_confirmed'];
/** Entity status that counts as published. */
const PUBLISHED_STATUS = 'active';

/**
 * SSOT mapping: the Cat's entity-creating action ids are `create_<type>` for
 * every registry type (only some have handlers today — unknown ids simply
 * never appear in the log, so deriving from the registry stays correct as
 * handlers are added).
 */
const CREATE_ACTION_TO_TYPE: ReadonlyMap<string, EntityType> = new Map(
  ENTITY_TYPES.map(type => [`create_${type}`, type])
);

// ==================== DERIVATION ====================

interface LogRow {
  action_id: string;
  result: { id?: unknown; title?: unknown } | null;
  completed_at: string | null;
  created_at: string;
}

/**
 * Compute the user's Cat track record for the recent window.
 * Returns null when the proposal log is unavailable; an empty record (proposed
 * 0) when the log is readable but Cat hasn't created anything in the window.
 */
export async function getCatTrackRecord(
  supabase: AnySupabaseClient,
  userId: string
): Promise<CatTrackRecord | null> {
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: logRows, error: logError } = await supabase
    .from(DATABASE_TABLES.CAT_ACTION_LOG)
    .select('action_id, result, completed_at, created_at')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .in('action_id', [...CREATE_ACTION_TO_TYPE.keys()])
    .gte('created_at', since)
    .order('created_at', { ascending: false });

  if (logError) {
    logger.warn('Track record unavailable', { error: logError.message }, 'CatTrackRecord');
    return null;
  }

  // Proposal side: completed create_* actions whose result carries the entity id.
  const proposals: Array<{ entityType: EntityType; entityId: string; createdAt: string }> = [];
  for (const row of (logRows || []) as LogRow[]) {
    const entityType = CREATE_ACTION_TO_TYPE.get(row.action_id);
    const entityId = row.result && typeof row.result.id === 'string' ? row.result.id : null;
    if (entityType && entityId) {
      proposals.push({ entityType, entityId, createdAt: row.completed_at || row.created_at });
    }
  }

  if (proposals.length === 0) {
    return {
      proposed: 0,
      published: 0,
      funded: 0,
      totalFundedBtc: 0,
      entries: [],
      windowDays: WINDOW_DAYS,
    };
  }

  const recent = proposals.slice(0, MAX_ENTRIES);

  // Outcome side 1 — current entity state, one query per entity type present.
  const idsByType = new Map<EntityType, string[]>();
  for (const p of recent) {
    idsByType.set(p.entityType, [...(idsByType.get(p.entityType) || []), p.entityId]);
  }
  const entityState = new Map<string, { title: string; status: string }>();
  await Promise.all(
    [...idsByType.entries()].map(async ([type, ids]) => {
      const { data, error } = await supabase
        .from(ENTITY_REGISTRY[type].tableName)
        .select('id, title, status')
        .in('id', ids);
      if (error) {
        logger.warn(
          'Track record entity lookup failed',
          { type, error: error.message },
          'CatTrackRecord'
        );
        return;
      }
      for (const row of data || []) {
        entityState.set(row.id, { title: row.title ?? '(untitled)', status: row.status ?? null });
      }
    })
  );

  // Outcome side 2 — settled payments toward those entities.
  const funding = new Map<string, { btc: number; payments: number }>();
  const { data: intents, error: intentsError } = await supabase
    .from(DATABASE_TABLES.PAYMENT_INTENTS)
    .select('entity_id, amount_btc, status')
    .in(
      'entity_id',
      recent.map(p => p.entityId)
    )
    .in('status', SETTLED_INTENT_STATUSES);
  if (intentsError) {
    logger.warn(
      'Track record funding lookup failed',
      { error: intentsError.message },
      'CatTrackRecord'
    );
  } else {
    for (const intent of intents || []) {
      const prev = funding.get(intent.entity_id) || { btc: 0, payments: 0 };
      funding.set(intent.entity_id, {
        btc: prev.btc + Number(intent.amount_btc || 0),
        payments: prev.payments + 1,
      });
    }
  }

  const entries: TrackRecordEntry[] = recent.map(p => {
    const state = entityState.get(p.entityId) || null;
    const funded = funding.get(p.entityId) || { btc: 0, payments: 0 };
    return {
      entityType: p.entityType,
      entityId: p.entityId,
      title: state?.title ?? '(deleted)',
      createdAt: p.createdAt,
      status: state?.status ?? null,
      fundedBtc: funded.btc,
      payments: funded.payments,
    };
  });

  return {
    proposed: proposals.length,
    published: entries.filter(e => e.status === PUBLISHED_STATUS).length,
    funded: entries.filter(e => e.fundedBtc > 0).length,
    totalFundedBtc: entries.reduce((sum, e) => sum + e.fundedBtc, 0),
    entries,
    windowDays: WINDOW_DAYS,
  };
}
