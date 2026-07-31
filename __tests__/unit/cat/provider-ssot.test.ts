/**
 * Guards the provider-list SSOT: WIRED_PROVIDER_IDS (src/data/aiProviders)
 * is the one list of routable providers. Every other provider collection
 * must be derived from or contained in it — this test fails the build the
 * moment a new hand-maintained copy drifts (the drift that once let
 * Anthropic/Google keys be saved as "valid" and silently dropped from the
 * routing chain).
 */

import { WIRED_PROVIDER_IDS, aiProviders, wiredProviders } from '@/data/aiProviders';
import {
  IMAGE_PROVIDER_RUNTIME,
  PROVIDER_BASE_URLS,
  PROVIDER_RUNTIME,
} from '@/config/ai-provider-runtime';

describe('provider SSOT invariants', () => {
  it('PROVIDER_BASE_URLS covers exactly the wired providers', () => {
    expect(Object.keys(PROVIDER_BASE_URLS).sort()).toEqual([...WIRED_PROVIDER_IDS].sort());
  });

  it('every wired provider exists in the aiProviders display SSOT', () => {
    const displayIds = new Set(aiProviders.map(p => p.id));
    for (const id of WIRED_PROVIDER_IDS) {
      expect(displayIds.has(id)).toBe(true);
    }
    expect(wiredProviders.map(p => p.id).sort()).toEqual([...WIRED_PROVIDER_IDS].sort());
  });

  it('image-capable providers are a subset of wired providers', () => {
    const wired = new Set<string>(WIRED_PROVIDER_IDS);
    for (const id of Object.keys(IMAGE_PROVIDER_RUNTIME)) {
      expect(wired.has(id)).toBe(true);
    }
  });

  it('PROVIDER_RUNTIME entries use base URLs from the URL SSOT', () => {
    for (const [id, runtime] of Object.entries(PROVIDER_RUNTIME)) {
      expect(runtime.baseUrl).toBe(PROVIDER_BASE_URLS[id as keyof typeof PROVIDER_BASE_URLS]);
    }
  });
});
