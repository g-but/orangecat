/**
 * Materialisation resumes; it never duplicates and never unwinds (ADR-0004 D3).
 *
 * There is no cross-table transaction available at claim time, and unwinding
 * would be worse than retrying: a rollback that deletes a bar the recipient
 * just watched appear is strictly worse than a second attempt. So every
 * created row is recorded in `profile_claims.materialized` AS IT HAPPENS, and
 * a re-run skips whatever is already there.
 *
 * The failure mode these tests exist to prevent is the expensive one: a claim
 * that half-succeeded, retried, and created Karl's bar twice.
 */

import { vi, beforeEach } from 'vitest';

const createGroup = vi.fn();
const createProject = vi.fn();

vi.mock('@/services/groups/mutations/groups', () => ({
  createGroup: (...args: unknown[]) => createGroup(...args),
}));
vi.mock('@/domain/projects/service', () => ({
  createProject: (...args: unknown[]) => createProject(...args),
}));

import {
  materializeClaimEntities,
  readLedger,
  emptyLedger,
} from '@/domain/profileClaims/materialize';
import type { ClaimEntityDraft } from '@/domain/profileClaims/draft';

const client = {} as never;

const bar: ClaimEntityDraft = { kind: 'group', name: 'Löwenbar', label: 'company' };
const taproom: ClaimEntityDraft = { kind: 'project', title: 'New taproom' };

beforeEach(() => {
  createGroup.mockReset();
  createProject.mockReset();
});

describe('readLedger', () => {
  it('tolerates a null or corrupt column', () => {
    // A corrupt ledger must not block a retry — the worst case is re-creating,
    // and that is exactly what the index check below prevents.
    expect(readLedger(null)).toEqual(emptyLedger());
    expect(readLedger('nonsense')).toEqual(emptyLedger());
    expect(readLedger({ entities: 'no' })).toEqual(emptyLedger());
    expect(readLedger({ entities: [{ bad: true }] })).toEqual(emptyLedger());
  });

  it('keeps well-formed entries', () => {
    const ledger = {
      entities: [{ index: 0, kind: 'group' as const, id: 'g1', slug: 'loewenbar' }],
    };
    expect(readLedger(ledger)).toEqual(ledger);
  });
});

describe('materializeClaimEntities', () => {
  it('creates a group owned by the claimer', async () => {
    createGroup.mockResolvedValue({ success: true, group: { id: 'g1', slug: 'loewenbar' } });

    const result = await materializeClaimEntities({
      entities: [bar],
      userId: 'karl',
      client,
      existing: emptyLedger(),
    });

    // The claimer's id is passed as the creating user — the bar is created
    // ALREADY OWNED by Karl, never created by someone else and transferred.
    expect(createGroup).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Löwenbar', label: 'company' }),
      client,
      'karl'
    );
    expect(result.failures).toEqual([]);
    expect(result.ledger.entities).toEqual([
      { index: 0, kind: 'group', id: 'g1', slug: 'loewenbar' },
    ]);
  });

  it('SKIPS what the ledger already records — the anti-duplication guarantee', async () => {
    createGroup.mockResolvedValue({ success: true, group: { id: 'g2', slug: 'x' } });

    const result = await materializeClaimEntities({
      entities: [bar, taproom],
      userId: 'karl',
      client,
      existing: { entities: [{ index: 0, kind: 'group', id: 'g1', slug: 'loewenbar' }] },
    });

    // Karl's bar already exists. A retry must not make a second one.
    expect(createGroup).not.toHaveBeenCalled();
    expect(result.ledger.entities.filter(e => e.index === 0)).toHaveLength(1);
  });

  it('records progress after EACH creation, not once at the end', async () => {
    createGroup.mockResolvedValue({ success: true, group: { id: 'g1', slug: 'a' } });
    createProject.mockResolvedValue({ id: 'p1' });

    const snapshots: number[] = [];
    await materializeClaimEntities({
      entities: [bar, taproom],
      userId: 'karl',
      client,
      existing: emptyLedger(),
      onProgress: async ledger => {
        snapshots.push(ledger.entities.length);
      },
    });

    // Persisting once at the end would lose the whole point: a crash mid-way
    // leaves rows created and unrecorded, and the retry duplicates them.
    expect(snapshots).toEqual([1, 2]);
  });

  it('keeps going after one failure and reports it', async () => {
    createGroup.mockResolvedValue({ success: false, error: 'slug clash' });
    createProject.mockResolvedValue({ id: 'p1' });

    const result = await materializeClaimEntities({
      entities: [bar, taproom],
      userId: 'karl',
      client,
      existing: emptyLedger(),
    });

    // One bad entity must not cost the recipient the others.
    expect(result.failures).toEqual([{ index: 0, reason: 'slug clash' }]);
    expect(result.ledger.entities).toEqual([{ index: 1, kind: 'project', id: 'p1' }]);
  });

  it('treats a thrown error as a failure, not a crash', async () => {
    createGroup.mockRejectedValue(new Error('network gone'));

    const result = await materializeClaimEntities({
      entities: [bar],
      userId: 'karl',
      client,
      existing: emptyLedger(),
    });

    expect(result.ledger.entities).toEqual([]);
    expect(result.failures[0].reason).toBe('network gone');
  });

  it('reports a project that came back without an id', async () => {
    // Silently succeeding here would tell the recipient their project is live
    // when nothing was written.
    createProject.mockResolvedValue(null);

    const result = await materializeClaimEntities({
      entities: [taproom],
      userId: 'karl',
      client,
      existing: emptyLedger(),
    });

    expect(result.ledger.entities).toEqual([]);
    expect(result.failures).toHaveLength(1);
  });

  it('does nothing at all for a claim with no entities', async () => {
    const result = await materializeClaimEntities({
      entities: [],
      userId: 'karl',
      client,
      existing: emptyLedger(),
    });

    expect(createGroup).not.toHaveBeenCalled();
    expect(createProject).not.toHaveBeenCalled();
    expect(result).toEqual({ ledger: emptyLedger(), failures: [] });
  });
});
