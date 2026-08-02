import {
  getCustomInstructions,
  MAX_CUSTOM_INSTRUCTIONS_LENGTH,
} from '@/services/cat/custom-instructions';
import { buildCatSystemPrompt } from '@/services/cat/system-prompt';
import type { AnySupabaseClient } from '@/lib/supabase/types';

/**
 * Cat custom instructions — the user's standing instructions.
 *
 * Two contracts matter:
 * 1. getCustomInstructions is best-effort: missing row, empty/whitespace value,
 *    or a failed read must all yield undefined — a preference can never break a
 *    chat turn. Values are trimmed and hard-capped at the SSOT length.
 * 2. buildCatSystemPrompt injects them as a delimited section that names them
 *    preferences-not-overrides, placed BEFORE the user context, and omits the
 *    section entirely when there are none.
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

describe('getCustomInstructions', () => {
  it('returns the trimmed instructions when set', async () => {
    const supabase = supabaseReturning({ custom_instructions: '  Answer in German.  ' });
    expect(await getCustomInstructions(supabase, 'u1')).toBe('Answer in German.');
  });

  it('returns undefined when no preferences row exists', async () => {
    expect(await getCustomInstructions(supabaseReturning(null), 'u1')).toBeUndefined();
  });

  it('returns undefined for empty or whitespace-only instructions', async () => {
    expect(
      await getCustomInstructions(supabaseReturning({ custom_instructions: '   ' }), 'u1')
    ).toBeUndefined();
    expect(
      await getCustomInstructions(supabaseReturning({ custom_instructions: null }), 'u1')
    ).toBeUndefined();
  });

  it('caps runaway values at the SSOT length', async () => {
    const long = 'x'.repeat(MAX_CUSTOM_INSTRUCTIONS_LENGTH + 500);
    const result = await getCustomInstructions(
      supabaseReturning({ custom_instructions: long }),
      'u1'
    );
    expect(result).toHaveLength(MAX_CUSTOM_INSTRUCTIONS_LENGTH);
  });

  it('returns undefined when the read throws (never break a chat turn)', async () => {
    const throwing = {
      from: () => {
        throw new Error('db down');
      },
    } as unknown as AnySupabaseClient;
    expect(await getCustomInstructions(throwing, 'u1')).toBeUndefined();
  });
});

describe('buildCatSystemPrompt with custom instructions', () => {
  it('omits the standing-instructions section when none are set', () => {
    expect(buildCatSystemPrompt({})).not.toContain('Standing Instructions From This User');
    expect(buildCatSystemPrompt({ userContext: 'ctx' })).not.toContain(
      'Standing Instructions From This User'
    );
  });

  it('injects instructions in a delimited section that names them preferences, not overrides', () => {
    const prompt = buildCatSystemPrompt({ customInstructions: 'Prefer Lightning.' });
    expect(prompt).toContain('## Standing Instructions From This User');
    expect(prompt).toContain('Prefer Lightning.');
    // The guardrail wording must survive edits: instructions never trump the rules.
    expect(prompt).toMatch(/preferences, not overrides/i);
  });

  it('places instructions after the base prompt and before the user context', () => {
    const prompt = buildCatSystemPrompt({
      customInstructions: 'INSTRUCTIONS_MARKER',
      userContext: 'CONTEXT_MARKER',
    });
    const instructionsAt = prompt.indexOf('INSTRUCTIONS_MARKER');
    const contextAt = prompt.indexOf('CONTEXT_MARKER');
    expect(instructionsAt).toBeGreaterThan(0);
    expect(contextAt).toBeGreaterThan(instructionsAt);
  });
});
