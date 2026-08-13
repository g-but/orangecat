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

  it('treats a profile as fixture if either field matches', () => {
    expect(isFixtureProfile({ username: 'adelina1996gry', name: 'E2E Reset User' })).toBe(true);
    expect(isFixtureProfile({ username: 'adelina1996gry', name: 'Adelina' })).toBe(false);
  });
});
