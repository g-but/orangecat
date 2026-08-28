/**
 * Opening a thread must not cost a round-trip per reply.
 *
 * `getReplies` recursed: one query AND one `enrichEventsForDisplay` per node.
 * Enrichment is itself several requests — profiles, projects, the reader's id,
 * and the three reaction tables — so a thread cost roughly six round-trips per
 * reply. Measured in production 2026-08-28 by opening one post: eight
 * `/auth/v1/user` calls alone, for a thread with three replies.
 *
 * The cost is what these tests hold. Asserting only "the tree is correct" is
 * what let the shape regress in the first place — the recursive version built a
 * perfectly correct tree.
 */

import { getReplies } from '@/services/timeline/queries/eventQueries';

const from = jest.fn();
const enrich = jest.fn();

jest.mock('@/lib/supabase/browser', () => ({
  __esModule: true,
  default: { from: (...a: unknown[]) => from(...a) },
}));
jest.mock('@/services/timeline/processors/enrichment', () => ({
  enrichEventsForDisplay: (...a: unknown[]) => enrich(...a),
}));
jest.mock('@/services/timeline/processors/reaction-state', () => ({
  attachReactionState: async <T,>(x: T) => x,
  EMPTY_REACTION_STATE: {},
}));
jest.mock('@/lib/supabase/untyped', () => ({ callRpc: jest.fn() }));

/** Rows keyed by the set of parents asked for, so we can serve level by level. */
function tableReturning(rowsByLevel: Array<Array<Record<string, unknown>>>) {
  let level = 0;
  from.mockImplementation(() => {
    const chain: Record<string, unknown> = {};
    for (const m of ['select', 'eq', 'order']) {
      chain[m] = () => chain;
    }
    chain.in = () => chain;
    chain.limit = () => Promise.resolve({ data: rowsByLevel[level++] ?? [], error: null });
    return chain;
  });
}

describe('getReplies query cost', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Enrichment echoes its input, mapped to the display shape the tree needs.
    enrich.mockImplementation(async (rows: Array<Record<string, unknown>>) =>
      rows.map(r => ({ id: r.id, parentEventId: r.parent_event_id }))
    );
  });

  it('asks once per DEPTH, not once per reply', async () => {
    // Three replies to the root, none nested: one level of content, then empty.
    tableReturning([
      [
        { id: 'r1', parent_event_id: 'root' },
        { id: 'r2', parent_event_id: 'root' },
        { id: 'r3', parent_event_id: 'root' },
      ],
      [],
    ]);

    const result = await getReplies('root');

    expect(result.success).toBe(true);
    expect(result.replies).toHaveLength(3);
    // Two queries: the level with replies, and the one that came back empty.
    // The recursive version made four for this shape, and would make one more
    // for every additional reply.
    expect(from).toHaveBeenCalledTimes(2);
  });

  it('enriches the whole tree exactly once', async () => {
    tableReturning([
      [{ id: 'r1', parent_event_id: 'root' }, { id: 'r2', parent_event_id: 'root' }],
      [{ id: 'r3', parent_event_id: 'r1' }],
      [],
    ]);

    await getReplies('root');

    expect(enrich).toHaveBeenCalledTimes(1);
    // And it got every node, so nothing is left un-enriched.
    expect(enrich.mock.calls[0][0]).toHaveLength(3);
  });

  it('still nests replies under the right parent', async () => {
    tableReturning([
      [{ id: 'r1', parent_event_id: 'root' }],
      [{ id: 'r2', parent_event_id: 'r1' }],
      [],
    ]);

    const result = await getReplies('root');

    expect(result.replies?.[0].id).toBe('r1');
    expect(result.replies?.[0].replies?.[0].id).toBe('r2');
    expect(result.replies?.[0].replyCount).toBe(1);
  });
});
