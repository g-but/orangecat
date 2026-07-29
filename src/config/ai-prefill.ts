/**
 * AI Form Prefill — configuration SSOT
 *
 * The prefill bar serves two genuinely different intents, and conflating them
 * is what made "make the description longer" a silent no-op: the refinement was
 * treated as a fresh description, and every already-filled field was force-kept.
 *
 *  - `generate`: the user describes what they want to create. Fields they typed
 *    themselves are sacred — AI output must never clobber them.
 *  - `refine`:   the user issues an instruction against the form as it stands.
 *    Already-filled fields are exactly what the instruction is about, so AI
 *    output MUST win. Preserving them here defeats the whole feature.
 */

export type PrefillMode = 'generate' | 'refine';

export const PREFILL_MODES: readonly PrefillMode[] = ['generate', 'refine'] as const;

export const DEFAULT_PREFILL_MODE: PrefillMode = 'generate';

/**
 * Minimum length of the user's input, per mode.
 *
 * A first description needs enough substance for the AI to extract fields from.
 * A refinement is an instruction, and useful ones are short ("shorter", "in
 * German too") — holding them to the same floor rejected valid instructions.
 */
export const PREFILL_MIN_INPUT_LENGTH: Record<PrefillMode, number> = {
  generate: 10,
  refine: 2,
};

/**
 * Token ceiling for the AI response. Refinements like "longer, in English and
 * German" legitimately produce long field values; too low a ceiling truncates
 * the JSON mid-string and surfaces as "Could not parse AI response".
 */
export const PREFILL_MAX_TOKENS = 2000;

export function isPrefillMode(value: unknown): value is PrefillMode {
  return typeof value === 'string' && (PREFILL_MODES as readonly string[]).includes(value);
}
