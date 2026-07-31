import { memoryConsentGranted } from '@/services/cat/memory';
import { deleteAllConversations } from '@/services/cat/conversation-history';
import type { AnySupabaseClient } from '@/lib/supabase/types';

/**
 * Data-controls P0: the memory consent toggle and delete-all conversations.
 *
 * memoryConsentGranted gates extractAndStoreMemories — its failure semantics
 * matter: a missing preferences row or a failed read must default to TRUE
 * (memory on), because silently disabling memory on a transient DB error would
 * be a worse bug than the one the toggle solves. Only an explicit
 * memory_enabled=false may turn it off.
 */

function supabaseReturning(row: unknown, error: unknown = null): AnySupabaseClient {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: row, error }),
        }),
      }),
    }),
  } as unknown as AnySupabaseClient;
}

describe('memoryConsentGranted', () => {
  it('defaults to true when no preferences row exists', async () => {
    expect(await memoryConsentGranted(supabaseReturning(null), 'u1')).toBe(true);
  });

  it('is true when memory_enabled is true', async () => {
    expect(await memoryConsentGranted(supabaseReturning({ memory_enabled: true }), 'u1')).toBe(
      true
    );
  });

  it('is false ONLY on explicit memory_enabled=false', async () => {
    expect(await memoryConsentGranted(supabaseReturning({ memory_enabled: false }), 'u1')).toBe(
      false
    );
  });

  it('defaults to true when the read throws (never silently disable on error)', async () => {
    const throwing = {
      from: () => {
        throw new Error('db down');
      },
    } as unknown as AnySupabaseClient;
    expect(await memoryConsentGranted(throwing, 'u1')).toBe(true);
  });
});

describe('deleteAllConversations', () => {
  it('deletes cat_conversations rows scoped to the user and reports success', async () => {
    const calls: Array<{ table: string; column: string; value: string }> = [];
    const supabase = {
      from: (table: string) => ({
        delete: () => ({
          eq: async (column: string, value: string) => {
            calls.push({ table, column, value });
            return { error: null };
          },
        }),
      }),
    } as unknown as AnySupabaseClient;

    expect(await deleteAllConversations(supabase, 'user-123')).toBe(true);
    expect(calls).toEqual([{ table: 'cat_conversations', column: 'user_id', value: 'user-123' }]);
  });

  it('reports failure when the delete errors', async () => {
    const supabase = {
      from: () => ({
        delete: () => ({
          eq: async () => ({ error: { message: 'nope' } }),
        }),
      }),
    } as unknown as AnySupabaseClient;
    expect(await deleteAllConversations(supabase, 'user-123')).toBe(false);
  });
});
