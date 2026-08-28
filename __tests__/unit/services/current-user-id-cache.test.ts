/**
 * Learning who is reading costs a network call, so do it once.
 *
 * `supabase.auth.getUser()` validates the token against `/auth/v1/user` — it is
 * not a local read. Enrichment calls it once per pass, and enrichment runs once
 * per node while a reply tree is built, so opening a thread fired one
 * round-trip per reply just to re-learn the same id. Production 2026-08-28:
 * eight `/auth/v1/user` calls to open one post.
 *
 * The concurrency case matters as much as the repeat case: enrichment is
 * deliberately parallel, so several callers arrive together and must collapse
 * onto one request rather than racing to make several.
 */

import { getCurrentUserId, __resetCurrentUserIdCache } from '@/services/timeline/processors/social-shared';

const getUser = jest.fn();
jest.mock('@/lib/supabase/browser', () => ({
  __esModule: true,
  default: { auth: { getUser: (...a: unknown[]) => getUser(...a) } },
}));

describe('getCurrentUserId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetCurrentUserIdCache();
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
  });

  it('asks the network once, however many times it is called', async () => {
    expect(await getCurrentUserId()).toBe('u1');
    expect(await getCurrentUserId()).toBe('u1');
    expect(await getCurrentUserId()).toBe('u1');

    expect(getUser).toHaveBeenCalledTimes(1);
  });

  it('collapses concurrent callers onto one request', async () => {
    const [a, b, c] = await Promise.all([
      getCurrentUserId(),
      getCurrentUserId(),
      getCurrentUserId(),
    ]);

    expect([a, b, c]).toEqual(['u1', 'u1', 'u1']);
    expect(getUser).toHaveBeenCalledTimes(1);
  });

  it('does not cache a failure as "signed out"', async () => {
    __resetCurrentUserIdCache();
    getUser.mockRejectedValueOnce(new Error('network blip'));

    expect(await getCurrentUserId()).toBeNull();

    // A blip must not outlive itself and render the whole timeline as
    // signed-out for the rest of the page.
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    expect(await getCurrentUserId()).toBe('u1');
  });

  it('caches a genuine signed-out answer', async () => {
    __resetCurrentUserIdCache();
    getUser.mockResolvedValue({ data: { user: null } });

    expect(await getCurrentUserId()).toBeNull();
    expect(await getCurrentUserId()).toBeNull();

    expect(getUser).toHaveBeenCalledTimes(1);
  });
});
