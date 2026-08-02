/**
 * getModelDisplayName — friendly names for reply provenance.
 *
 * Providers report resolved ids that can carry snapshot suffixes the registry
 * doesn't key on; the UI must never print a raw slug under a reply.
 */

import { getModelDisplayName, AI_MODEL_REGISTRY } from '@/config/ai-models';

describe('getModelDisplayName', () => {
  it('returns the registry name for an exact id', () => {
    expect(getModelDisplayName('nvidia/nemotron-3-super-120b-a12b:free')).toBe(
      AI_MODEL_REGISTRY['nvidia/nemotron-3-super-120b-a12b:free'].name
    );
  });

  it('resolves dated snapshot ids to the registered model name', () => {
    // Providers can append snapshot suffixes to current free-model ids too.
    expect(getModelDisplayName('google/gemma-4-31b-it-20260402:free')).toBe(
      AI_MODEL_REGISTRY['google/gemma-4-31b-it:free'].name
    );
  });

  it('matches only at segment boundaries (20b must not swallow 120b)', () => {
    expect(getModelDisplayName('openai/gpt-oss-120b-0525')).toBe(
      AI_MODEL_REGISTRY['openai/gpt-oss-120b'].name
    );
    expect(getModelDisplayName('openai/gpt-oss-20b-0525:free')).toBe(
      AI_MODEL_REGISTRY['openai/gpt-oss-20b:free'].name
    );
  });

  it('resolves a shorter reported id to the registered variant', () => {
    // Server may strip a suffix relative to the registry key.
    expect(getModelDisplayName('nvidia/nemotron-3-super-120b-a12b')).toBe(
      AI_MODEL_REGISTRY['nvidia/nemotron-3-super-120b-a12b:free'].name
    );
  });

  it('prettifies unknown slugs instead of echoing them raw', () => {
    const name = getModelDisplayName('mistralai/devstral-small-2505:free');
    expect(name).not.toContain('/');
    expect(name).not.toContain(':free');
    expect(name).toBe('Devstral Small 2505 (Free)');
  });

  it('uppercases parameter-size tokens in derived names', () => {
    expect(getModelDisplayName('acme/foo-bar-32b')).toBe('Foo Bar 32B');
  });
});
