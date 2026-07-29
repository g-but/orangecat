/**
 * MANUAL / LIVE — hits the real AI provider, so it is skipped unless a key is
 * present and it sits outside the `test:unit` path pattern. The mocked
 * regression lock lives in `__tests__/unit/lib/ai/form-prefill-refine.test.ts`;
 * this file exists to prove the model actually obeys the refine prompt.
 *
 * Run: npx jest --env=node __tests__/manual/live-prefill-refine.test.ts
 * (needs GROQ_API_KEY or OPENROUTER_API_KEY in the environment)
 */

import { generateFormPrefill } from '@/lib/ai/form-prefill-service';
import { getEntityConfig } from '@/config/entity-configs/get-config';

const hasProviderKey = Boolean(process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY);
const describeLive = hasProviderKey ? describe : describe.skip;

const CURRENT_FORM = {
  title: 'Photography',
  description: 'I offer photography.',
  category: 'Photography',
  pricing_model: 'hourly',
  hourly_rate: 50,
  currency: 'CHF',
};

const INSTRUCTION = 'make description longer and in english and german';

describeLive('LIVE: the exact reported refinement', () => {
  it('rewrites the description longer and bilingually', async () => {
    const config = getEntityConfig('service');
    const result = await generateFormPrefill(
      'service',
      INSTRUCTION,
      config!,
      CURRENT_FORM,
      undefined,
      'refine'
    );

    // eslint-disable-next-line no-console
    console.log('\n=== REFINE RESULT ===\n', JSON.stringify(result, null, 2), '\n');

    expect(result.success).toBe(true);
    const description = String(result.data.description ?? '');
    expect(description).not.toBe(CURRENT_FORM.description);
    expect(description.length).toBeGreaterThan(CURRENT_FORM.description.length * 3);
    // German half present (umlaut or a common German word)
    expect(description).toMatch(/\b(ich|biete|und|für|Fotografie|Dienstleistung)\b/i);
  }, 60000);

  it('shows generate mode would still have preserved the old value', async () => {
    const config = getEntityConfig('service');
    const result = await generateFormPrefill(
      'service',
      INSTRUCTION,
      config!,
      CURRENT_FORM,
      undefined,
      'generate'
    );

    // eslint-disable-next-line no-console
    console.log('\n=== GENERATE RESULT (old behaviour) ===\n', JSON.stringify(result.data), '\n');
    expect(result.data.description).toBe(CURRENT_FORM.description);
  }, 60000);
});
