/**
 * A health check must answer the question the user is actually asking.
 *
 * On 2026-08-06 production reported `catCanAnswer: true` — "Cat is healthy:
 * groq probe returned OK" — on a day when Cat could not answer a single
 * person. Both things were true at once:
 *   - the Groq probe pings with ~5 tokens, so it returns 200 whenever the key
 *     and the service are fine, and
 *   - Cat's real prompt exceeds Groq's per-minute token limit, so every actual
 *     message 413s and falls through to OpenRouter, whose free tier was
 *     exhausted for the day (429).
 *
 * A probe that exercises the endpoint but not the payload measures the wrong
 * thing, and a green light nobody can act on is worse than a red one.
 */

import { runCatHealthProbes, groqCanServeCatPrompt } from '@/services/cat/health-probes';

const OK = { ok: true, status: 200, json: async () => ({ choices: [] }) };
const RATE_LIMITED = {
  ok: false,
  status: 429,
  json: async () => ({ error: { message: 'Rate limit exceeded: free-models-per-day' } }),
};

/** Groq up, OpenRouter out of daily quota — the exact production state. */
function mockFetch() {
  return vi.fn(async (url: unknown) => {
    const u = String(url);
    if (u.includes('/models')) {
      return { ok: true, status: 200, json: async () => ({ data: [] }) };
    }
    return u.includes('groq') ? OK : RATE_LIMITED;
  });
}

describe('Cat health report honesty', () => {
  const realFetch = global.fetch;
  const realEnv = { ...process.env };

  beforeEach(() => {
    process.env.GROQ_API_KEY = 'test-groq-key';
    process.env.OPENROUTER_API_KEY = 'test-or-key';
    global.fetch = mockFetch() as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = realFetch;
    process.env = { ...realEnv };
  });

  it('does not claim Cat can answer when Groq cannot take the prompt and OpenRouter is capped', async () => {
    const report = await runCatHealthProbes();

    // Provider-level: Groq itself is fine. That is not the question.
    expect(report.probes.groq.class).toBe('ok');
    expect(report.probes.openrouter.class).toBe('rate_limit');

    // The claim that matters must track prompt fit, not just provider liveness.
    expect(report.catCanAnswer).toBe(groqCanServeCatPrompt());
  });

  it('says WHY Groq is unusable rather than reporting it as healthy', async () => {
    const report = await runCatHealthProbes();
    if (groqCanServeCatPrompt()) {
      // The prompt now fits — the honest report is a healthy one.
      expect(report.summary).toMatch(/healthy/i);
      return;
    }
    expect(report.summary).not.toMatch(/Cat is healthy/i);
    expect(report.summary).toMatch(/prompt too large|cannot serve Cat/i);
  });

  it('reports prompt fit as its own fact, so shrinking work has a live signal', async () => {
    const report = await runCatHealthProbes();
    expect(typeof report.groqCanServeCatPrompt).toBe('boolean');
    expect(report.groqCanServeCatPrompt).toBe(groqCanServeCatPrompt());
  });
});
