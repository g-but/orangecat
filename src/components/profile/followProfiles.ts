/**
 * Shared shapes + extraction for the People tab's follow data.
 *
 * Split out of ProfilePeopleTab so the component stays under the size gate.
 */

/** A person shown in the People tab. */
export interface Connection {
  id: string;
  username: string;
  /** profiles.name — the column really is `name`; there is no display_name. */
  name?: string;
  avatar_url: string | null;
  bio: string | null;
}

type JoinedProfile = {
  id: string;
  username: string;
  name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
};

/** `profiles` when queried directly; `profile` when it comes from /api/social/*. */
export type FollowWithProfile = {
  profiles?: JoinedProfile | null;
  profile?: JoinedProfile | null;
};

/**
 * Pull the joined profile out of a follow row.
 *
 * The two data paths disagree on the key: querying supabase directly gives
 * `profiles`, while /api/social/* aliases it to `profile` (singular). The
 * component only ever read `profiles`, so on the API path every row yielded
 * `undefined` — and the old `!== null` filter let undefined through, so the
 * render crashed on `.username` and signed-out visitors got the error boundary
 * instead of a profile page. Accept either key and drop anything falsy.
 */
export function extractProfiles(rows: FollowWithProfile[]): Connection[] {
  return rows
    .map(row => row.profile ?? row.profiles)
    .filter((p): p is JoinedProfile => Boolean(p)) as Connection[];
}
