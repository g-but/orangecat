import {
  forgetMemoriesMatching,
  rememberFacts,
  editMemoryMatching,
  isSuppressedFact,
} from '@/services/cat/memory';
import type { AnySupabaseClient } from '@/lib/supabase/types';

/**
 * remember_fact / edit_memory / suppression — the full memory CRUD contract:
 * an explicit remember stores (and lifts suppression), an edit corrects exactly
 * one row or refuses, and a forgotten fact stays forgotten (extraction-side
 * suppression). Embeddings are disabled in the unit env, so the lexical layer
 * is under test — mirroring memory-forget.test.ts.
 */

interface Tables {
  cat_memories: Array<{ id: string; content: string }>;
  cat_forgotten_facts: Array<{ user_id?: string; content: string }>;
}

function mockSupabase(tables: Tables) {
  const inserted: Record<string, unknown[]> = {};
  const updated: Array<{ table: string; values: Record<string, unknown> }> = [];
  const deleted: Record<string, unknown[]> = {};

  const client = {
    from: (table: string) => {
      const rows: unknown[] =
        table === 'cat_memories'
          ? tables.cat_memories
          : table === 'cat_forgotten_facts'
            ? tables.cat_forgotten_facts
            : [];
      const builder: Record<string, unknown> = {};
      const chain = () => builder;
      for (const m of ['select', 'eq', 'in', 'order', 'limit']) {
        builder[m] = chain;
      }
      builder.insert = (values: unknown[]) => {
        inserted[table] = [...(inserted[table] ?? []), ...values];
        return Promise.resolve({ error: null });
      };
      builder.update = (values: Record<string, unknown>) => {
        updated.push({ table, values });
        return { eq: () => ({ eq: async () => ({ error: null }) }) };
      };
      builder.delete = () => ({
        eq: () => ({
          in: async (_col: string, ids: unknown[]) => {
            deleted[table] = [...(deleted[table] ?? []), ...ids];
            return { error: null };
          },
        }),
        in: async (_col: string, ids: unknown[]) => {
          deleted[table] = [...(deleted[table] ?? []), ...ids];
          return { error: null };
        },
      });
      builder.then = (resolve: (v: unknown) => void) => {
        resolve({ data: rows, error: null, count: rows.length });
      };
      return builder;
    },
    rpc: async () => ({ data: [], error: null }),
  } as unknown as AnySupabaseClient;

  return { client, inserted, updated, deleted };
}

describe('rememberFacts', () => {
  it('stores explicit facts and reports them', async () => {
    const { client, inserted } = mockSupabase({ cat_memories: [], cat_forgotten_facts: [] });
    const result = await rememberFacts(client, 'u1', ['Speaks Italian', 'Workshop is in Basel']);
    expect(result.stored).toEqual(['Speaks Italian', 'Workshop is in Basel']);
    expect(result.duplicates).toEqual([]);
    const rows = inserted.cat_memories as Array<{ content: string; source: string }>;
    expect(rows).toHaveLength(2);
    expect(rows[0].source).toBe('user');
  });

  it('lifts a matching suppression before storing (remember outranks forget)', async () => {
    const { client, deleted } = mockSupabase({
      cat_memories: [],
      cat_forgotten_facts: [{ content: 'Speaks French' }],
    });
    await rememberFacts(client, 'u1', ['Speaks French fluently']);
    expect(deleted.cat_forgotten_facts).toEqual(['Speaks French']);
  });

  it('rejects empty input', async () => {
    const { client, inserted } = mockSupabase({ cat_memories: [], cat_forgotten_facts: [] });
    const result = await rememberFacts(client, 'u1', ['', '  ']);
    expect(result.stored).toEqual([]);
    expect(inserted.cat_memories).toBeUndefined();
  });
});

describe('editMemoryMatching', () => {
  const CORPUS = [
    { id: 'm1', content: 'Sells the ceramic mug for CHF 40' },
    { id: 'm2', content: 'Owns a drone.' },
  ];

  it('updates exactly the matching memory and reports before/after', async () => {
    const { client, updated } = mockSupabase({
      cat_memories: [...CORPUS],
      cat_forgotten_facts: [],
    });
    const result = await editMemoryMatching(
      client,
      'u1',
      'ceramic mug CHF 40',
      'Sells the ceramic mug for CHF 45'
    );
    expect(result).toEqual({
      ok: true,
      previous: 'Sells the ceramic mug for CHF 40',
      updated: 'Sells the ceramic mug for CHF 45',
    });
    expect(updated).toHaveLength(1);
    expect(updated[0].values.content).toBe('Sells the ceramic mug for CHF 45');
  });

  it('refuses when several memories match, listing the candidates', async () => {
    const { client, updated } = mockSupabase({
      cat_memories: [
        { id: 'm1', content: 'Has a documentary photography background' },
        { id: 'm2', content: 'Is a professional photographer' },
      ],
      cat_forgotten_facts: [],
    });
    const result = await editMemoryMatching(client, 'u1', 'photography', 'Does astrophotography');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('ambiguous');
      expect(result.candidates).toHaveLength(2);
    }
    expect(updated).toHaveLength(0);
  });

  it('reports not_found honestly', async () => {
    const { client } = mockSupabase({ cat_memories: [...CORPUS], cat_forgotten_facts: [] });
    const result = await editMemoryMatching(client, 'u1', 'plays the tuba', 'Plays the trumpet');
    expect(result).toEqual({ ok: false, reason: 'not_found' });
  });
});

describe('suppression — deleted facts stay deleted', () => {
  it('forgetting records the deleted contents in the suppression list', async () => {
    const { client, inserted } = mockSupabase({
      cat_memories: [{ id: 'm1', content: 'Knows French' }],
      cat_forgotten_facts: [],
    });
    const result = await forgetMemoriesMatching(client, 'u1', ['speaking French']);
    expect(result.deleted).toEqual(['Knows French']);
    const suppressed = (inserted.cat_forgotten_facts ?? []) as Array<{ content: string }>;
    expect(suppressed.map(s => s.content)).toEqual(
      expect.arrayContaining(['Knows French', 'speaking French'])
    );
  });

  it('a forgotten fact is suppressed for re-extraction (inflections included)', async () => {
    const { client } = mockSupabase({
      cat_memories: [],
      cat_forgotten_facts: [{ content: 'Knows French' }, { content: 'photography skills' }],
    });
    expect(await isSuppressedFact(client, 'u1', 'Speaks French', null)).toBe(true);
    expect(await isSuppressedFact(client, 'u1', 'Is a professional photographer', null)).toBe(true);
    expect(await isSuppressedFact(client, 'u1', 'Owns a drone', null)).toBe(false);
  });
});
