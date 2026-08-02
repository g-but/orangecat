import { forgetMemoriesMatching } from '@/services/cat/memory';
import type { AnySupabaseClient } from '@/lib/supabase/types';

/**
 * forget_memories is the honesty contract for Cat's memory: the tool must
 * delete what actually matches and report EXACTLY what happened, because the
 * model repeats this result to the user verbatim. The founding bug: Cat said
 * "I've removed photography/French/ceramics" while all three memories stayed —
 * there was no tool at all, so the model fabricated success.
 */

interface Row {
  id: string;
  content: string;
}

function supabaseWithCorpus(corpus: Row[], opts: { deleteError?: unknown } = {}) {
  const deleted: string[][] = [];
  const client = {
    from: () => ({
      select: () => ({
        eq: async () => ({ data: corpus, error: null }),
      }),
      delete: () => ({
        eq: () => ({
          in: async (_col: string, ids: string[]) => {
            deleted.push(ids);
            return { error: opts.deleteError ?? null };
          },
        }),
      }),
    }),
    // Embeddings are disabled in unit tests (no provider env), so the RPC
    // path is never hit; text containment is the behavior under test.
    rpc: async () => ({ data: [], error: null }),
  } as unknown as AnySupabaseClient;
  return { client, deleted };
}

const CORPUS: Row[] = [
  { id: 'm1', content: 'Has photography skills, speaks French, and makes handmade ceramics.' },
  { id: 'm2', content: 'Owns a drone.' },
  { id: 'm3', content: 'Wants to earn extra income on weekends.' },
];

describe('forgetMemoriesMatching', () => {
  it('deletes memories containing the requested fact (either direction)', async () => {
    const { client, deleted } = supabaseWithCorpus(CORPUS);
    const result = await forgetMemoriesMatching(client, 'u1', ['photography']);
    expect(deleted[0]).toEqual(['m1']);
    expect(result.deleted).toEqual([CORPUS[0].content]);
    expect(result.notFound).toEqual([]);
  });

  it('one call can match multiple facts across multiple memories', async () => {
    const { client, deleted } = supabaseWithCorpus(CORPUS);
    // Text mode requires ≥2 significant-word overlaps (single-word overlap
    // would over-delete); looser phrasings are caught by the embeddings path.
    const result = await forgetMemoriesMatching(client, 'u1', [
      'speaks French',
      'income on weekends',
    ]);
    expect(deleted[0]).toEqual(expect.arrayContaining(['m1', 'm3']));
    expect(result.deleted).toHaveLength(2);
  });

  it('reports notFound honestly instead of claiming success', async () => {
    const { client, deleted } = supabaseWithCorpus(CORPUS);
    const result = await forgetMemoriesMatching(client, 'u1', ['plays the tuba']);
    expect(deleted).toHaveLength(0);
    expect(result.deleted).toEqual([]);
    expect(result.notFound).toEqual(['plays the tuba']);
  });

  it('a failed delete reports nothing as deleted', async () => {
    const { client } = supabaseWithCorpus(CORPUS, { deleteError: { message: 'boom' } });
    const result = await forgetMemoriesMatching(client, 'u1', ['photography']);
    expect(result.deleted).toEqual([]);
    expect(result.notFound).toEqual(['photography']);
  });

  it('ignores degenerate fragments that would match everything', async () => {
    const { client, deleted } = supabaseWithCorpus(CORPUS);
    const result = await forgetMemoriesMatching(client, 'u1', ['a', ' is ']);
    expect(deleted).toHaveLength(0);
    expect(result.deleted).toEqual([]);
  });
});
