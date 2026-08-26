/**
 * Civic allocation domain service.
 *
 * An allocation is the only entity on the platform whose meaning lives in its
 * CHILDREN: a directive without lines says nothing, and lines that do not total
 * 100% are not a split. So this service, not the generic entity handler, owns
 * writing the two tables together — the generic handler would try to insert
 * `lines` as a column and fail, and even if it dropped the key it would create
 * a directive that means nothing.
 *
 * The 100% rule is enforced in the database
 * (`civic_allocation_assert_balanced`, deferred to end of transaction) and
 * mirrored in Zod so the form can say so first. The database stays the
 * authority; this service re-checks the total in exactly one place — before
 * rewriting the lines of an ALREADY PUBLISHED directive, where finding out too
 * late would leave a person's live argument as an unfinished draft. Everywhere
 * else it lets the database refuse and translates the error into something a
 * person can act on.
 */

import { looseClient } from '@/lib/supabase/untyped';
import type { AnySupabaseClient } from '@/lib/supabase/types';
import { getTableName } from '@/config/entity-registry';
import {
  ALLOCATION_TOTAL_PERCENT,
  isAllocationBalanced,
  type AllocationRecipientKind,
} from '@/config/civic-allocation';
import type { AllocationFormData, AllocationLineFormData } from '@/lib/validation/civic';
import { logger } from '@/utils/logger';

const ALLOCATIONS_TABLE = getTableName('allocation');
const LINES_TABLE = 'civic_allocation_lines';
const JURISDICTIONS_TABLE = getTableName('jurisdiction');

/** Raised when the database rejects a directive whose shares do not total 100. */
export class UnbalancedAllocationError extends Error {
  constructor(total: number) {
    super(
      `Shares total ${total}%, not ${ALLOCATION_TOTAL_PERCENT}%. Move the allocation back to draft to edit it, or adjust the shares.`
    );
    this.name = 'UnbalancedAllocationError';
  }
}

export interface AllocationLineRow {
  id: string;
  position: number;
  share_percent: number;
  jurisdiction_id: string | null;
  recipient_entity_type: string | null;
  recipient_entity_id: string | null;
  external_name: string | null;
  external_url: string | null;
  note: string | null;
}

export interface ResolvedAllocationLine extends AllocationLineRow {
  kind: AllocationRecipientKind;
  /** Display name of the recipient, resolved for jurisdictions. */
  recipientName: string;
  /** Level, when the recipient is a jurisdiction. */
  recipientLevel: string | null;
  recipientHref: string | null;
}

/** The shape of `lines` as it arrives from a form: no ids, position implied by order. */
type LineInput = AllocationLineFormData;

/**
 * Strip a line down to the columns the table actually has, and blank out the
 * two recipient shapes that were not chosen.
 *
 * Blanking matters: a form that lets someone pick a jurisdiction, change their
 * mind and type an external name would otherwise submit both, and the database's
 * "exactly one recipient" CHECK would reject the whole directive with a
 * constraint name rather than anything a person could act on.
 */
function toLineRow(line: LineInput, allocationId: string, position: number) {
  const usesJurisdiction = Boolean(line.jurisdiction_id);
  const usesEntity = Boolean(line.recipient_entity_type && line.recipient_entity_id);

  return {
    allocation_id: allocationId,
    position,
    share_percent: line.share_percent,
    jurisdiction_id: usesJurisdiction ? line.jurisdiction_id : null,
    recipient_entity_type: !usesJurisdiction && usesEntity ? line.recipient_entity_type : null,
    recipient_entity_id: !usesJurisdiction && usesEntity ? line.recipient_entity_id : null,
    external_name: !usesJurisdiction && !usesEntity ? line.external_name || null : null,
    external_url: !usesJurisdiction && !usesEntity ? line.external_url || null : null,
    note: line.note || null,
  };
}

/** Postgres raises our balance error as a generic exception; recognise it. */
function isBalanceViolation(error: { message?: string } | null): boolean {
  return Boolean(error?.message?.includes('lines total'));
}

export class CivicAllocationService {
  constructor(private supabase: AnySupabaseClient) {}

  /**
   * Create a directive and its lines.
   *
   * Not a transaction: PostgREST has no multi-statement transaction, so the
   * parent is written first and the lines second. The failure window is real
   * and is handled by creating the parent as `draft` whenever lines are
   * present, then promoting it only once the lines land. A half-written
   * directive is therefore always a draft the owner can see and finish — never
   * an active split that silently misstates what someone believes they
   * published.
   */
  async createWithLines(
    input: AllocationFormData & { actor_id: string }
  ): Promise<Record<string, unknown>> {
    const { lines = [], actor_id, ...allocation } = input;
    const targetStatus = allocation.status ?? 'draft';
    const hasLines = lines.length > 0;

    const { data: created, error } = await looseClient(this.supabase)
      .from(ALLOCATIONS_TABLE)
      .insert({
        ...allocation,
        actor_id,
        // Always land as draft when there are lines to write; promote below.
        status: hasLines ? 'draft' : targetStatus,
        period_start: allocation.period_start || null,
        period_end: allocation.period_end || null,
        residency_jurisdiction_id: allocation.residency_jurisdiction_id || null,
      })
      .select()
      .single();

    if (error || !created) {
      throw new Error(error?.message ?? 'Failed to create allocation');
    }

    const createdRow = created as Record<string, unknown>;
    const allocationId = createdRow.id as string;
    if (!hasLines) {
      return createdRow;
    }

    try {
      await this.replaceLines(allocationId, lines);
      if (targetStatus === 'draft') {
        return { ...createdRow, lines };
      }

      const { data: promoted, error: promoteError } = await looseClient(this.supabase)
        .from(ALLOCATIONS_TABLE)
        .update({ status: targetStatus })
        .eq('id', allocationId)
        .select()
        .single();

      if (promoteError) {
        if (isBalanceViolation(promoteError)) {
          throw new UnbalancedAllocationError(
            lines.reduce((sum, line) => sum + line.share_percent, 0)
          );
        }
        throw new Error(promoteError.message);
      }
      return { ...((promoted as Record<string, unknown> | null) ?? createdRow), lines };
    } catch (linesError) {
      // The parent survives as a draft on purpose — see the note above. Deleting
      // it here would throw away a person's rationale and every line that did
      // land, to save them from a row they can simply finish.
      logger.warn('Allocation created but its lines failed; left as draft', {
        allocationId,
        error: linesError instanceof Error ? linesError.message : String(linesError),
      });
      throw linesError;
    }
  }

  /**
   * Replace every line of a directive.
   *
   * Delete-then-insert rather than a diff: lines carry no identity a person
   * assigns (a share pointed at a recipient IS the line), so a diff would be
   * machinery in service of nothing.
   *
   * The wrinkle is that the two statements are two PostgREST requests, and so
   * two TRANSACTIONS. The balance trigger is deferred to end of transaction,
   * which makes an unbalanced intermediate state legal WITHIN one transaction
   * but not across two: on a published directive, the delete alone would commit
   * a split totalling 0% and the database would refuse it — correctly, and with
   * an error naming a state the person never asked for.
   *
   * So a published directive is demoted to draft for the rewrite and promoted
   * back afterwards. That is the same rule the schema states, carried out on the
   * person's behalf: a published split cannot be unbalanced, so changing one
   * means briefly not publishing it.
   *
   * Verified against Postgres 16: the delete-alone case fails and leaves the old
   * split intact; the demote/replace/promote sequence succeeds.
   */
  async replaceLines(allocationId: string, lines: LineInput[]): Promise<AllocationLineRow[]> {
    const { data: current } = await looseClient(this.supabase)
      .from(ALLOCATIONS_TABLE)
      .select('status')
      .eq('id', allocationId)
      .maybeSingle();

    const previousStatus = (current as { status?: string } | null)?.status ?? 'draft';
    const wasPublished = previousStatus !== 'draft';

    // Checked BEFORE anything is written. On a published directive the rewrite
    // takes it off-air for two round trips, and doing that only to discover the
    // new split totals 97% would leave a person's published argument as an
    // unfinished draft because of a mistake the request could have been
    // rejected for.
    if (wasPublished && !isAllocationBalanced(lines.map(line => line.share_percent))) {
      throw new UnbalancedAllocationError(lines.reduce((sum, line) => sum + line.share_percent, 0));
    }

    if (wasPublished) {
      const { error: demoteError } = await looseClient(this.supabase)
        .from(ALLOCATIONS_TABLE)
        .update({ status: 'draft' })
        .eq('id', allocationId);
      if (demoteError) {
        throw new Error(demoteError.message);
      }
    }

    const { error: deleteError } = await looseClient(this.supabase)
      .from(LINES_TABLE)
      .delete()
      .eq('allocation_id', allocationId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    let written: AllocationLineRow[] = [];
    if (lines.length > 0) {
      const rows = lines.map((line, index) =>
        toLineRow(line, allocationId, line.position ?? index)
      );
      const { data, error } = await looseClient(this.supabase)
        .from(LINES_TABLE)
        .insert(rows)
        .select();

      if (error) {
        if (isBalanceViolation(error)) {
          throw new UnbalancedAllocationError(
            lines.reduce((sum, line) => sum + line.share_percent, 0)
          );
        }
        throw new Error(error.message);
      }
      written = (data ?? []) as unknown as AllocationLineRow[];
    }

    if (wasPublished) {
      const { error: promoteError } = await looseClient(this.supabase)
        .from(ALLOCATIONS_TABLE)
        .update({ status: previousStatus })
        .eq('id', allocationId);
      // Should not happen — the total was checked above — but if it does, the
      // directive stays a draft holding the new lines rather than silently
      // reverting to a split the person has replaced.
      if (promoteError) {
        throw new Error(
          `Lines saved, but the directive could not be re-published: ${promoteError.message}`
        );
      }
    }

    return written;
  }

  /**
   * Lines of a directive with their recipients resolved for display.
   *
   * Jurisdictions are fetched in ONE query keyed by id rather than per line —
   * a four-line directive making four round trips is the classic N+1, and this
   * runs on every render of a public page.
   */
  async getResolvedLines(allocationId: string): Promise<ResolvedAllocationLine[]> {
    const { data, error } = await looseClient(this.supabase)
      .from(LINES_TABLE)
      .select('*')
      .eq('allocation_id', allocationId)
      .order('position', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }
    const lines = (data ?? []) as unknown as AllocationLineRow[];
    if (lines.length === 0) {
      return [];
    }

    const jurisdictionIds = lines
      .map(line => line.jurisdiction_id)
      .filter((id): id is string => Boolean(id));

    const jurisdictionsById = new Map<string, { title: string; level: string }>();
    if (jurisdictionIds.length > 0) {
      const { data: jurisdictions } = await looseClient(this.supabase)
        .from(JURISDICTIONS_TABLE)
        .select('id, title, level')
        .in('id', jurisdictionIds);

      for (const row of jurisdictions ?? []) {
        jurisdictionsById.set(row.id as string, {
          title: row.title as string,
          level: row.level as string,
        });
      }
    }

    return lines.map(line => {
      if (line.jurisdiction_id) {
        const jurisdiction = jurisdictionsById.get(line.jurisdiction_id);
        return {
          ...line,
          kind: 'jurisdiction' as const,
          // A jurisdiction the reader may not read (draft/archived) resolves to
          // nothing rather than to a blank name — the share is still real.
          recipientName: jurisdiction?.title ?? 'A government body',
          recipientLevel: jurisdiction?.level ?? null,
          recipientHref: `/jurisdictions/${line.jurisdiction_id}`,
        };
      }
      if (line.recipient_entity_type && line.recipient_entity_id) {
        return {
          ...line,
          kind: 'entity' as const,
          recipientName: line.external_name ?? line.recipient_entity_type,
          recipientLevel: null,
          recipientHref: `/${line.recipient_entity_type}s/${line.recipient_entity_id}`,
        };
      }
      return {
        ...line,
        kind: 'external' as const,
        recipientName: line.external_name ?? 'Unnamed recipient',
        recipientLevel: null,
        recipientHref: line.external_url,
      };
    });
  }

  /**
   * How much declared support a jurisdiction carries.
   *
   * This is the number that makes the whole entity worth building: not what a
   * body received, but how many people have publicly said what share it should
   * get, and what they said on average. It is the signal Solon converts into a
   * proposal, and it is readable long before a single payment moves.
   *
   * Counts only public, active directives — a private split is nobody's
   * evidence, and counting it would leak it.
   */
  async getDeclaredSupport(jurisdictionId: string): Promise<{
    supporterCount: number;
    averageShare: number;
    medianShare: number;
  }> {
    const { data, error } = await looseClient(this.supabase)
      .from(LINES_TABLE)
      .select('share_percent, civic_allocations!inner(status, visibility)')
      .eq('jurisdiction_id', jurisdictionId)
      .eq('civic_allocations.status', 'active')
      .eq('civic_allocations.visibility', 'public');

    if (error) {
      logger.warn('Failed to read declared support', { jurisdictionId, error: error.message });
      return { supporterCount: 0, averageShare: 0, medianShare: 0 };
    }

    const shares = ((data ?? []) as Array<Record<string, unknown>>)
      .map(row => Number(row.share_percent))
      .filter(share => Number.isFinite(share))
      .sort((a, b) => a - b);

    if (shares.length === 0) {
      return { supporterCount: 0, averageShare: 0, medianShare: 0 };
    }

    const sum = shares.reduce((total, share) => total + share, 0);
    const middle = Math.floor(shares.length / 2);
    const median =
      shares.length % 2 === 0 ? (shares[middle - 1] + shares[middle]) / 2 : shares[middle];

    return {
      supporterCount: shares.length,
      averageShare: Math.round((sum / shares.length) * 100) / 100,
      medianShare: Math.round(median * 100) / 100,
    };
  }

  /**
   * The containment chain above a jurisdiction, nearest first.
   *
   * Walks parents iteratively with a hard bound rather than recursing: the
   * schema forbids cycles (a parent must outrank its child), but a bound costs
   * nothing and means a corrupted row cannot hang a page render.
   */
  async getChain(jurisdictionId: string, maxDepth = 8): Promise<Array<Record<string, unknown>>> {
    const chain: Array<Record<string, unknown>> = [];
    let currentId: string | null = jurisdictionId;

    for (let depth = 0; depth < maxDepth && currentId; depth += 1) {
      // Annotated rather than inferred: `currentId` is both an input to this
      // query and assigned from its result, and TS reads that round trip as a
      // circular initializer if the row type is left to inference.
      const result: { data: Record<string, unknown> | null; error: unknown } = await looseClient(
        this.supabase
      )
        .from(JURISDICTIONS_TABLE)
        .select('id, title, level, parent_id, country_code, region_code, verification_status')
        .eq('id', currentId)
        .maybeSingle();

      if (result.error || !result.data) {
        break;
      }
      chain.push(result.data);
      currentId = (result.data.parent_id as string | null) ?? null;
    }

    return chain;
  }
}
