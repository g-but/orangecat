import { removeFromEconomicProfile } from '@/services/cat/economic-profile';
import type { AnySupabaseClient } from '@/lib/supabase/types';

/**
 * removeFromEconomicProfile is the profile half of the "that's wrong, remove
 * it" verb. The critical property: it OVERWRITES the row (saveEconomicProfile
 * merge-unions and can never shrink), and it reports exactly what it removed.
 */

const PROFILE_ROW = {
  skills: [{ name: 'photography' }, { name: 'full-stack web development' }, 'French'],
  assets: [{ name: 'a drone' }, { name: 'handmade ceramic coffee mug' }],
  goals: [{ text: 'earn extra income on weekends', kind: 'earn' }],
  constraints: ['mainly available on weekends'],
  asked_for: ['suggestions on what to offer'],
  motivation: 'earn',
  stage: 'exploring',
};

function supabaseWithProfile(row: unknown) {
  const upserts: Array<Record<string, unknown>> = [];
  const client = {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: row, error: null }),
        }),
      }),
      upsert: async (payload: Record<string, unknown>) => {
        upserts.push(payload);
        return { error: null };
      },
    }),
  } as unknown as AnySupabaseClient;
  return { client, upserts };
}

describe('removeFromEconomicProfile', () => {
  it('removes matching entries across dimensions and overwrites the row', async () => {
    const { client, upserts } = supabaseWithProfile(PROFILE_ROW);
    const result = await removeFromEconomicProfile(client, 'u1', [
      'photography',
      'French',
      'available on weekends',
    ]);

    expect(result.removed).toEqual(
      expect.arrayContaining([
        'skill: photography',
        'skill: French',
        'constraint: mainly available on weekends',
      ])
    );
    expect(upserts).toHaveLength(1);
    const saved = upserts[0];
    expect(saved.skills).toEqual([{ name: 'full-stack web development' }]);
    expect(saved.constraints).toEqual([]);
    // Untouched dimensions survive the overwrite.
    expect(saved.asked_for).toEqual(['suggestions on what to offer']);
    expect(saved.motivation).toBe('earn');
  });

  it('reports notFound for terms matching nothing, without writing', async () => {
    const { client, upserts } = supabaseWithProfile(PROFILE_ROW);
    const result = await removeFromEconomicProfile(client, 'u1', ['plays the tuba']);
    expect(result.removed).toEqual([]);
    expect(result.notFound).toEqual(['plays the tuba']);
    expect(upserts).toHaveLength(0);
  });

  it('handles a missing profile row as all-notFound', async () => {
    const { client, upserts } = supabaseWithProfile(null);
    const result = await removeFromEconomicProfile(client, 'u1', ['photography']);
    expect(result.removed).toEqual([]);
    expect(result.notFound).toEqual(['photography']);
    expect(upserts).toHaveLength(0);
  });
});
