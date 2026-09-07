/**
 * Turning a claim's drafted entities into real rows, owned by the claimer.
 *
 * ADR-0004 D2 — CLAIMING MATERIALISES, NOTHING EVER TRANSFERS. The person who
 * drafted the bar never owned it: before the claim the rows do not exist, and
 * at claim time they are created *already owned by the claimer*. No transfer
 * step means no half-transferred state, no reconciliation job, and no second
 * source of truth about who owns a fundable thing — which is what keeps
 * ADR-0003's money invariant structural rather than remembered.
 *
 * ADR-0004 D3 — RESUMABLE, NOT TRANSACTIONAL. There is no cross-table
 * transaction available here, and unwinding would be worse than retrying: a
 * rollback that deletes a group the recipient just watched appear is a strictly
 * worse outcome than a second attempt. So every created row is recorded in
 * `profile_claims.materialized` as it happens, and a re-run skips whatever is
 * already there. A claim that half-succeeded resumes; it never duplicates and
 * never unwinds.
 */

import { createGroup } from '@/services/groups/mutations/groups';
import { createProject } from '@/domain/projects/service';
import { logger } from '@/utils/logger';
import type { AnySupabaseClient } from '@/lib/supabase/types';
import type { ClaimEntityDraft } from './draft';

/** One entity that has actually been created, keyed by its position in the draft. */
export interface MaterializedEntity {
  index: number;
  kind: ClaimEntityDraft['kind'];
  id: string;
  /** Groups get a slug; projects are addressed by id. */
  slug?: string;
}

export interface MaterializedLedger {
  entities: MaterializedEntity[];
}

export function emptyLedger(): MaterializedLedger {
  return { entities: [] };
}

/** Tolerates a null/garbage ledger, so a corrupt column cannot block a retry. */
export function readLedger(raw: unknown): MaterializedLedger {
  if (raw && typeof raw === 'object' && Array.isArray((raw as MaterializedLedger).entities)) {
    return {
      entities: (raw as MaterializedLedger).entities.filter(e => e && typeof e.index === 'number'),
    };
  }
  return emptyLedger();
}

export interface MaterializeResult {
  ledger: MaterializedLedger;
  /** Entities that could not be created this run. Empty means fully done. */
  failures: Array<{ index: number; reason: string }>;
}

/**
 * Create every drafted entity that is not already in the ledger.
 *
 * `client` is the CLAIMER's request-scoped client, so every insert lands
 * inside their own RLS — the recipient creates their own bar, the platform
 * does not create it for them with elevated privilege.
 *
 * `onProgress` is called after each successful creation so the caller can
 * persist the ledger immediately. Persisting once at the end would lose the
 * whole point: a crash mid-way would leave rows created and unrecorded, and
 * the retry would duplicate them.
 */
export async function materializeClaimEntities(params: {
  entities: ClaimEntityDraft[];
  userId: string;
  client: AnySupabaseClient;
  existing: MaterializedLedger;
  onProgress?: (ledger: MaterializedLedger) => Promise<void>;
}): Promise<MaterializeResult> {
  const { entities, userId, client, existing, onProgress } = params;

  const ledger: MaterializedLedger = { entities: [...existing.entities] };
  const failures: MaterializeResult['failures'] = [];
  const done = new Set(ledger.entities.map(e => e.index));

  for (const [index, entity] of entities.entries()) {
    if (done.has(index)) {
      continue;
    }

    try {
      if (entity.kind === 'group') {
        // `createGroup` generates a unique slug, applies the label's defaults,
        // and enables its suggested features. The group's `actors` row and the
        // claimer's founder membership come from the
        // `groups_get_an_identity_and_an_owner` trigger, atomically with the
        // group row.
        const result = await createGroup(
          {
            name: entity.name,
            label: entity.label,
            description: entity.description,
            tags: entity.tags,
          },
          client,
          userId
        );

        if (!result.success || !result.group) {
          // `GroupResponse.error` is a plain string, not the API envelope —
          // narrowed explicitly rather than with `||`, which the repo bans
          // because that shape yields "[object Object]" on an envelope.
          const reason =
            typeof result.error === 'string' && result.error.length > 0
              ? result.error
              : 'group creation failed';
          failures.push({ index, reason });
          continue;
        }
        ledger.entities.push({
          index,
          kind: 'group',
          id: result.group.id,
          slug: result.group.slug,
        });
      } else {
        const project = await createProject(
          userId,
          {
            title: entity.title,
            // Required by projectSchema; the draft schema enforces it too, so
            // this is a narrowing rather than a default.
            description: entity.description,
            goal_amount: entity.goalAmount ?? null,
            currency: entity.currency ?? null,
            // Required by `projectSchema` (it has a `.default([])`, but the
            // inferred INPUT type still demands the key).
            tags: [],
          },
          client
        );

        const projectId = (project as { id?: string } | null)?.id;
        if (!projectId) {
          failures.push({ index, reason: 'project creation returned no id' });
          continue;
        }
        ledger.entities.push({ index, kind: 'project', id: projectId });
      }

      // Record immediately, not at the end — see the note on `onProgress`.
      if (onProgress) {
        await onProgress(ledger);
      }
    } catch (error) {
      logger.error('Failed to materialize claim entity', { error, index, kind: entity.kind });
      failures.push({
        index,
        reason: error instanceof Error ? error.message : 'unknown error',
      });
    }
  }

  return { ledger, failures };
}
