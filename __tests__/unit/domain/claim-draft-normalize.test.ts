/**
 * A link already sent to a real person must keep working.
 *
 * The claims dashboard had no navigation entry until 2026-09-07, which is why
 * `profile_claims` had zero rows. It has one now — so claims created between
 * that deploy and the entities[] deploy carry the OLD flat person shape:
 *
 *   { name, bio?, avatarUrl?, ... }            ← legacy
 *   { kind: 'person', profile: {...}, ... }    ← current
 *
 * `normalizeClaimDraft` is the only reader of `profile_claims.draft`, and it
 * has to accept both forever, because the alternative is a stranger opening a
 * link a friend sent them and seeing a broken page.
 */

import {
  normalizeClaimDraft,
  describeClaimEntity,
  MAX_CLAIM_ENTITIES,
  claimDraftSchema,
} from '@/domain/profileClaims/draft';

describe('normalizeClaimDraft', () => {
  it('reads the legacy flat person shape', () => {
    const draft = normalizeClaimDraft({
      name: 'Karl Meier',
      bio: 'Runs a bar.',
      website: 'https://loewenbar.test',
    });

    expect(draft).toEqual({
      kind: 'person',
      profile: { name: 'Karl Meier', bio: 'Runs a bar.', website: 'https://loewenbar.test' },
    });
  });

  it('reads the current shape unchanged', () => {
    const input = {
      kind: 'person' as const,
      profile: { name: 'Karl Meier' },
      entities: [{ kind: 'group' as const, name: 'Löwenbar', label: 'company' }],
    };
    expect(normalizeClaimDraft(input)).toEqual(input);
  });

  it('defaults a group label rather than rejecting the draft', () => {
    const draft = normalizeClaimDraft({
      kind: 'person',
      profile: { name: 'Karl' },
      entities: [{ kind: 'group', name: 'Löwenbar' }],
    });
    expect(draft?.entities?.[0]).toMatchObject({ kind: 'group', label: 'circle' });
  });

  it('returns null for something that is not a draft at all', () => {
    // A caller seeing null must treat the claim as broken rather than render
    // an empty person — which is why this is null and not `{name: ''}`.
    for (const junk of [null, undefined, 42, 'karl', {}, { profile: {} }, { name: '' }]) {
      expect(normalizeClaimDraft(junk)).toBeNull();
    }
  });

  it('rejects an unknown entity kind instead of silently dropping it', () => {
    // Silently dropping would mean the recipient accepts a page promising a
    // bar and receives nothing, with no error anywhere.
    const draft = normalizeClaimDraft({
      kind: 'person',
      profile: { name: 'Karl' },
      entities: [{ kind: 'spaceship', name: 'Nope' }],
    });
    expect(draft).toBeNull();
  });

  it('caps how many things one link can create', () => {
    const tooMany = {
      kind: 'person',
      profile: { name: 'Karl' },
      entities: Array.from({ length: MAX_CLAIM_ENTITIES + 1 }, (_, i) => ({
        kind: 'group',
        name: `G${i}`,
        label: 'circle',
      })),
    };
    // Materialisation runs on the recipient's behalf the moment they accept;
    // an uncapped list mints arbitrarily many fundable rows off one click.
    expect(claimDraftSchema.safeParse(tooMany).success).toBe(false);
    expect(normalizeClaimDraft(tooMany)).toBeNull();
  });
});

describe('describeClaimEntity', () => {
  it('names a group by name and a project by title', () => {
    expect(describeClaimEntity({ kind: 'group', name: 'Löwenbar', label: 'company' })).toBe(
      'Löwenbar'
    );
    expect(describeClaimEntity({ kind: 'project', title: 'New taproom' })).toBe('New taproom');
  });
});
