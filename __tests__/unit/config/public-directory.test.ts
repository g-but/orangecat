import {
  isFixtureUsername,
  isFixtureDisplayName,
  isFixtureProfile,
  isFixtureGroupTitle,
} from '@/config/public-directory';

describe('public-directory', () => {
  it('hides CI reset users and anonymous user_* handles', () => {
    expect(isFixtureUsername('e2e-reset-31746252739-1')).toBe(true);
    expect(isFixtureUsername('user_8d2f1325')).toBe(true);
    expect(isFixtureUsername('adelina1996gry')).toBe(false);
    expect(isFixtureUsername('mao')).toBe(false);
  });

  it('hides placeholder display names', () => {
    expect(isFixtureDisplayName('E2E Reset User')).toBe(true);
    expect(isFixtureDisplayName('User')).toBe(true);
    expect(isFixtureDisplayName('Adelina')).toBe(false);
  });

  it('hides audit/ephemeral groups', () => {
    expect(isFixtureGroupTitle('Audit WF009b 1783192620260')).toBe(true);
    expect(isFixtureGroupTitle('ephemeral verify WF-009')).toBe(true);
    expect(isFixtureGroupTitle('Bitcoin Developers Circle')).toBe(false);
  });

  // A named-prefix list only knows the shapes it has already met. "Audit Group
  // 1783191071580" was not one of them, so it survived into a live account's
  // context switcher after its two "Audit WF…" siblings were filtered out.
  it('hides audit groups whose wording nobody predicted', () => {
    expect(isFixtureGroupTitle('Audit Group 1783191071580')).toBe(true);
    expect(isFixtureGroupTitle('Workflow Smoke 1783191071580')).toBe(true);
    expect(isFixtureGroupTitle('e2e reset 1783191071580')).toBe(true);
  });

  // The timestamp is what makes the rule safe to widen: a real group is named
  // by a person, and people do not append an epoch. This matters here more than
  // most products — OrangeCat is heading for governance, where "Audit
  // Committee" is a group somebody will genuinely create.
  it('leaves real groups alone even when they start with an audit word', () => {
    expect(isFixtureGroupTitle('Audit Committee')).toBe(false);
    expect(isFixtureGroupTitle('Audit Committee 2026')).toBe(false);
    expect(isFixtureGroupTitle('Workflow Design Guild')).toBe(false);
  });

  it('treats a profile as fixture if either field matches', () => {
    expect(isFixtureProfile({ username: 'adelina1996gry', name: 'E2E Reset User' })).toBe(true);
    expect(isFixtureProfile({ username: 'adelina1996gry', name: 'Adelina' })).toBe(false);
  });
});
