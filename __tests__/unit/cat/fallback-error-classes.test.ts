/**
 * Fallback-chain error classification — the July 2026 outage regression guard.
 *
 * OpenRouter retired several free model ids; retired ids 404. The chain walk
 * used to advance ONLY on rate-limit errors, so one dead model id aborted the
 * walk and produced "Both Cat providers are temporarily down" while a live
 * model sat unused later in the chain. The walk must roll past BOTH
 * rate-limits and dead-model errors.
 */
import {
  isAiRateLimitError,
  isAiModelUnavailableError,
  isFallbackWorthyError,
} from '@/services/cat/ai-error-classes';

class ProviderError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

describe('isAiModelUnavailableError', () => {
  it('detects a 404 statusCode (OpenRouter retired-model response)', () => {
    expect(isAiModelUnavailableError(new ProviderError('No endpoints found', 404))).toBe(true);
  });

  it('detects retired/decommissioned model messages without a statusCode', () => {
    expect(
      isAiModelUnavailableError(new Error('No endpoints found for openai/gpt-oss-120b:free'))
    ).toBe(true);
    expect(
      isAiModelUnavailableError(
        new Error('The model `llama-3.1-70b-versatile` has been decommissioned')
      )
    ).toBe(true);
    expect(isAiModelUnavailableError(new Error('model not found'))).toBe(true);
  });

  it('does not flag rate limits or generic errors', () => {
    expect(isAiModelUnavailableError(new ProviderError('rate limit exceeded', 429))).toBe(false);
    expect(isAiModelUnavailableError(new Error('connection reset'))).toBe(false);
  });
});

describe('isFallbackWorthyError', () => {
  it('rolls the chain on rate limits AND dead models, nothing else', () => {
    expect(isFallbackWorthyError(new ProviderError('too many requests', 429))).toBe(true);
    expect(isFallbackWorthyError(new ProviderError('No endpoints found', 404))).toBe(true);
    expect(isFallbackWorthyError(new Error('connection reset'))).toBe(false);
  });

  it('agrees with isAiRateLimitError on the rate-limit half', () => {
    const err = new ProviderError('too many requests', 429);
    expect(isAiRateLimitError(err)).toBe(true);
    expect(isFallbackWorthyError(err)).toBe(true);
  });
});
