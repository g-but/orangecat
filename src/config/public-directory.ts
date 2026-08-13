/**
 * Who and what belongs on public directories (Discover, People).
 *
 * CI and workflow audits mint disposable users and groups. Those rows are
 * real in the database; they are not people a visitor came to find.
 */

const FIXTURE_USERNAME =
  /^(e2e-reset-|e2e_|wf0\d+|audit[-_]|user_[0-9a-f]{8}$)/i;
const FIXTURE_DISPLAY_NAME = /^(e2e reset user|user)$/i;
const FIXTURE_GROUP_TITLE = /^(audit\s+wf|ephemeral\s+verify|workflow\s+audit)/i;

export function isFixtureUsername(username: string | null | undefined): boolean {
  const u = (username ?? '').trim();
  return u.length === 0 || FIXTURE_USERNAME.test(u);
}

export function isFixtureDisplayName(name: string | null | undefined): boolean {
  return FIXTURE_DISPLAY_NAME.test((name ?? '').trim());
}

export function isFixtureProfile(profile: {
  username?: string | null;
  name?: string | null;
}): boolean {
  return isFixtureUsername(profile.username) || isFixtureDisplayName(profile.name);
}

export function isFixtureGroupTitle(title: string | null | undefined): boolean {
  return FIXTURE_GROUP_TITLE.test((title ?? '').trim());
}

/** PostgREST `not.ilike` clauses that drop the known fixture username shapes. */
export const DIRECTORY_USERNAME_EXCLUSIONS = [
  'username.not.ilike.e2e-reset-%',
  'username.not.ilike.e2e\\_%',
  'username.not.ilike.user\\_________',
] as const;
