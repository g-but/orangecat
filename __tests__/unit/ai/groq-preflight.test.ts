import {
  promptFitsGroqOnDemand,
  GROQ_ON_DEMAND_TPM_LIMIT,
  GROQ_CHAT_MAX_TOKENS,
} from '@/services/ai/groq';

/**
 * Pre-flight fit check for Groq's on-demand tier (2026-08-02 measurement:
 * 413 "Limit 12000" on the platform key). The Cat chain uses this to skip a
 * platform-Groq link that would deterministically 413 — every message was
 * paying a guaranteed-failing round-trip once the prompt outgrew the limit.
 */
describe('promptFitsGroqOnDemand', () => {
  it('a normal chat prompt fits', () => {
    expect(
      promptFitsGroqOnDemand([
        { content: 'You are Cat.' },
        { content: 'Hello, can you help me sell a mug?' },
      ])
    ).toBe(true);
  });

  it('a grown prompt (memories + history + page excerpt) does not fit', () => {
    // chars/4 + reserved output must exceed the TPM limit
    const chars = (GROQ_ON_DEMAND_TPM_LIMIT - GROQ_CHAT_MAX_TOKENS) * 4 + 8;
    expect(promptFitsGroqOnDemand([{ content: 'x'.repeat(chars) }])).toBe(false);
  });

  it('counts the reserved output budget against the same bucket', () => {
    // Just under the input budget alone, but over once max_tokens is reserved.
    const chars = GROQ_ON_DEMAND_TPM_LIMIT * 4 - 100;
    expect(promptFitsGroqOnDemand([{ content: 'x'.repeat(chars) }])).toBe(false);
  });

  it('ignores non-string content (tool-call assistant messages)', () => {
    expect(promptFitsGroqOnDemand([{ content: null }, { content: 'short' }])).toBe(true);
  });
});
