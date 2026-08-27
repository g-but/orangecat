/**
 * The identity resolver that turns an `actor_id` into somebody you can name.
 *
 * The cases that matter are the ones where getting it wrong publishes
 * something: a private group resolving, a hidden field surviving, a retired
 * handle going dark (and taking a saved Lightning address's owner with it).
 */
import {
  resolvePublicProfile,
  resolvePublicProfiles,
  isUuid,
} from '@/services/platform/publicProfiles';
import { parseBatchParam, PUBLIC_PROFILE_MAX_BATCH } from '@/config/public-profile';
import { profileHandleFromUrl } from '@/services/cat/platform-search';
import { SITE_URL } from '@/config/brand';
import type { AnySupabaseClient } from '@/lib/supabase/types';

const ACTOR_ALICE = '11111111-1111-4111-8111-111111111111';
const ACTOR_TEAM = '22222222-2222-4222-8222-222222222222';
const ACTOR_PRIVATE = '33333333-3333-4333-8333-333333333333';
const USER_ALICE = 'aaaaaaaa-1111-4111-8111-111111111111';
const USER_RENAMED = 'aaaaaaaa-2222-4222-8222-222222222222';
const ACTOR_RENAMED = '44444444-4444-4444-8444-444444444444';
const GROUP_TEAM = 'bbbbbbbb-1111-4111-8111-111111111111';
const GROUP_PRIVATE = 'bbbbbbbb-2222-4222-8222-222222222222';

const TABLES: Record<string, Array<Record<string, unknown>>> = {
  actors: [
    { id: ACTOR_ALICE, actor_type: 'user', user_id: USER_ALICE, group_id: null },
    { id: ACTOR_RENAMED, actor_type: 'user', user_id: USER_RENAMED, group_id: null },
    { id: ACTOR_TEAM, actor_type: 'group', user_id: null, group_id: GROUP_TEAM },
    { id: ACTOR_PRIVATE, actor_type: 'group', user_id: null, group_id: GROUP_PRIVATE },
  ],
  profiles: [
    {
      id: USER_ALICE,
      username: 'Alice',
      username_lower: 'alice',
      name: 'Alice Example',
      bio: 'Builds things',
      avatar_url: 'https://cdn.example/a.png',
      banner_url: null,
      website: 'https://alice.example',
      social_links: { x: 'alice' },
      privacy_settings: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-02-01T00:00:00Z',
    },
    {
      id: USER_RENAMED,
      username: 'bob_new',
      username_lower: 'bob_new',
      name: 'Bob',
      bio: null,
      avatar_url: null,
      banner_url: null,
      website: 'https://bob.example',
      social_links: null,
      // Bob hides his website; a visitor must not be able to tell it exists.
      privacy_settings: { hidden_fields: ['website'] },
      created_at: null,
      updated_at: null,
    },
  ],
  groups: [
    {
      id: GROUP_TEAM,
      name: 'Fleet Team',
      slug: 'fleet-team',
      description: 'Ships things',
      avatar_url: null,
      banner_url: null,
      visibility: 'public',
      is_public: true,
      created_at: null,
      updated_at: null,
    },
    {
      id: GROUP_PRIVATE,
      name: 'Secret Team',
      slug: 'secret-team',
      description: 'Not for you',
      avatar_url: null,
      banner_url: null,
      visibility: 'private',
      is_public: false,
      created_at: null,
      updated_at: null,
    },
  ],
  profile_username_history: [{ old_username: 'bob_old', profile_id: USER_RENAMED }],
};

/**
 * Minimal stand-in for the query shape the resolver actually uses:
 * `.from(table).select(cols).in(column, values)`. Deliberately not a general
 * Supabase mock — a fake that accepts calls the code never makes would let a
 * wrong query pass the test.
 */
function fakeClient(): AnySupabaseClient {
  return {
    from(table: string) {
      return {
        select() {
          return {
            in(column: string, values: unknown[]) {
              const rows = (TABLES[table] ?? []).filter(row => values.includes(row[column]));
              return Promise.resolve({ data: rows, error: null });
            },
          };
        },
      };
    },
  } as unknown as AnySupabaseClient;
}

describe('resolvePublicProfiles', () => {
  it('resolves a user by actor id, carrying the join key back', async () => {
    const [profile] = await resolvePublicProfiles(fakeClient(), { actorIds: [ACTOR_ALICE] });

    expect(profile).toMatchObject({
      actor_id: ACTOR_ALICE,
      kind: 'user',
      id: USER_ALICE,
      handle: 'Alice',
      display_name: 'Alice Example',
      website: 'https://alice.example',
      social_links: { x: 'alice' },
    });
    // Absolute, not a path: a client on another origin would resolve
    // "/profiles/Alice" against its own host and 404. Asserted against
    // SITE_URL rather than a literal, which varies by environment — the
    // property under test is that an origin is present at all.
    expect(profile.url).toMatch(/^https?:\/\//);
    expect(profile.url).toBe(`${SITE_URL}/profiles/Alice`);
  });

  it('resolves a group through the same door and in the same shape', async () => {
    const [profile] = await resolvePublicProfiles(fakeClient(), { actorIds: [ACTOR_TEAM] });

    expect(profile).toMatchObject({
      actor_id: ACTOR_TEAM,
      kind: 'group',
      id: GROUP_TEAM,
      handle: 'fleet-team',
      display_name: 'Fleet Team',
      bio: 'Ships things',
      website: null,
      social_links: null,
    });
  });

  it('never resolves a non-public group, by actor id or by slug', async () => {
    const client = fakeClient();
    await expect(resolvePublicProfiles(client, { actorIds: [ACTOR_PRIVATE] })).resolves.toEqual([]);
    await expect(resolvePublicProfiles(client, { handles: ['secret-team'] })).resolves.toEqual([]);
  });

  it('honours the owner hidden-field list, indistinguishably from unset', async () => {
    const [profile] = await resolvePublicProfiles(fakeClient(), { handles: ['bob_new'] });
    expect(profile.website).toBeNull();
  });

  it('matches handles case-insensitively', async () => {
    const [profile] = await resolvePublicProfiles(fakeClient(), { handles: ['ALICE'] });
    expect(profile.actor_id).toBe(ACTOR_ALICE);
  });

  it('still resolves a handle the account has retired', async () => {
    // A username is also a Lightning address, so a rename keeps the old handle
    // pointed at the account forever. A resolver that only knew current handles
    // would reintroduce exactly the breakage that history table prevents.
    const [profile] = await resolvePublicProfiles(fakeClient(), { handles: ['bob_old'] });
    expect(profile).toMatchObject({ actor_id: ACTOR_RENAMED, handle: 'bob_new' });
  });

  it('omits unknown references instead of failing the whole batch', async () => {
    const profiles = await resolvePublicProfiles(fakeClient(), {
      actorIds: [ACTOR_ALICE, '99999999-9999-4999-8999-999999999999'],
      handles: ['nobody-at-all'],
    });
    expect(profiles).toHaveLength(1);
    expect(profiles[0].actor_id).toBe(ACTOR_ALICE);
  });

  it('returns nothing when asked for nothing', async () => {
    await expect(resolvePublicProfiles(fakeClient(), {})).resolves.toEqual([]);
  });
});

describe('resolvePublicProfile', () => {
  it('accepts an actor id', async () => {
    const profile = await resolvePublicProfile(fakeClient(), ACTOR_ALICE);
    expect(profile?.id).toBe(USER_ALICE);
  });

  it('accepts an underlying profile id, not just the actor id', async () => {
    const profile = await resolvePublicProfile(fakeClient(), USER_ALICE);
    expect(profile?.actor_id).toBe(ACTOR_ALICE);
  });

  it('accepts a group id', async () => {
    const profile = await resolvePublicProfile(fakeClient(), GROUP_TEAM);
    expect(profile?.actor_id).toBe(ACTOR_TEAM);
  });

  it('does not resolve a private group by its raw id either', async () => {
    await expect(resolvePublicProfile(fakeClient(), GROUP_PRIVATE)).resolves.toBeNull();
  });

  it('accepts a handle, and returns null for an unknown one', async () => {
    await expect(resolvePublicProfile(fakeClient(), 'alice')).resolves.toMatchObject({
      actor_id: ACTOR_ALICE,
    });
    await expect(resolvePublicProfile(fakeClient(), 'ghost')).resolves.toBeNull();
    await expect(resolvePublicProfile(fakeClient(), '   ')).resolves.toBeNull();
  });
});

describe('isUuid', () => {
  it('separates ids from handles', () => {
    expect(isUuid(ACTOR_ALICE)).toBe(true);
    expect(isUuid('alice')).toBe(false);
    // A handle may legally contain hyphens; that must not read as a UUID.
    expect(isUuid('fleet-team')).toBe(false);
  });
});

describe('parseBatchParam', () => {
  it('splits, trims and dedupes', () => {
    expect(parseBatchParam(' a, b ,a,,c ')).toEqual(['a', 'b', 'c']);
  });

  it('treats a missing parameter as an empty ask, not an error', () => {
    expect(parseBatchParam(null)).toEqual([]);
  });

  it('refuses an oversized batch rather than silently truncating it', () => {
    // Truncating would be indistinguishable from "those actors do not exist".
    const tooMany = Array.from({ length: PUBLIC_PROFILE_MAX_BATCH + 1 }, (_, i) => `h${i}`);
    expect(parseBatchParam(tooMany.join(','))).toBeNull();
  });
});

describe('profileHandleFromUrl', () => {
  it('extracts the join key the semantic search path would otherwise lose', () => {
    expect(profileHandleFromUrl('/profiles/alice')).toBe('alice');
    expect(profileHandleFromUrl('/profiles/bob%20smith')).toBe('bob smith');
  });

  it('returns undefined for anything that is not a profile URL', () => {
    expect(profileHandleFromUrl('/projects/some-project')).toBeUndefined();
    expect(profileHandleFromUrl('/profiles/alice/extra')).toBeUndefined();
    expect(profileHandleFromUrl('#')).toBeUndefined();
    expect(profileHandleFromUrl(null)).toBeUndefined();
  });
});
